import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './models/user.entity';
import { Role } from './models/role.entity';
import { CreateUserDto } from './dto/create_user.dto';
import * as bcrypt from 'bcrypt';
import RoleName from './enums/user_name.enum';
import { UserResponseDto } from './dto/user_response.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private dataSource: DataSource) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user not with Id : ${id}`);
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('user.id = :id', { id })
      .andWhere('role.name = :roleName', { roleName: RoleName.USER })
      .getOne();
    if (!user) {
      this.logger.error(`User not found with Id : ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select([
        'user.id',
        'user.email',
        'user.createdAt',
        'user.updatedAt',
        'role.name',
      ])
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: users, total, page, limit };
  }

  async findAllUsers(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('role.name = :roleName', { roleName: RoleName.USER })
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: users, total, page, limit };
  }

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      if (dto.confirmPassword !== dto.password) {
        throw new BadRequestException(
          "confirm password and password don't match!",
        );
      }

      const existing = await repo.findOne({ where: { email: dto.email } });
      if (existing) throw new BadRequestException('Email already exists');

      const role = await roleRepo.findOne({ where: { name: RoleName.USER } });
      if (!role) throw new NotFoundException('Default role User not found');

      const hashed = await bcrypt.hash(dto.password, 10);
      const user = repo.create({ email: dto.email, password: hashed, role });

      const savedUser = await repo.save(user);

      return {
        id: savedUser.id,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        role: { name: savedUser.role.name },
      };
    });
  }
}
