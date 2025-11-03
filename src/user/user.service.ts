import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './models/user.entity';
import { Role } from '../common/models/role.entity';
import { CreateUserDto } from './dto/create_user.dto';
import * as bcrypt from 'bcrypt';

import { UserResponseDto } from './dto/user_response.dto';
import { RoleName } from '../common/enums/user_name.enum';
import { UpdateUserDto } from './dto/update_user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(private dataSource: DataSource) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user with Id : ${id}`);
    const user = await this.dataSource
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
      .where('user.id = :id', { id })
      .andWhere('role.name = :roleName', { roleName: RoleName.USER })
      .getOne();
    if (!user) {
      this.logger.error(`User not found with Id : ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByIdDeleted(id: string): Promise<User> {
    this.logger.debug(`Finding user with Id : ${id}`);
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('user.id = :id', { id })
      .andWhere('role.name = :roleName', { roleName: RoleName.USER })
      .withDeleted()
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
      .innerJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('role.name = :roleName', { roleName: RoleName.USER })
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: users, total, page, limit };
  }

  async findAllDeleted(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('role.name = :roleName', { roleName: RoleName.USER })
      .andWhere('user.deletedAt != NULL')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: users, total, page, limit };
  }

  async findAllNonDeleted(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('role.name = :roleName', { roleName: RoleName.USER })
      .andWhere('user.deletedAt = NULL')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: users, total, page, limit };
  }

  async create(
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      if (password !== confirmPassword) {
        throw new BadRequestException(
          "confirm password and password don't match!",
        );
      }

      const existing = await repo.findOne({ where: { email: email } });
      if (existing) throw new BadRequestException('Email already exists');

      const role = await roleRepo.findOne({ where: { name: RoleName.USER } });
      if (!role) throw new NotFoundException('Default role User not found');

      const hashed = await bcrypt.hash(password, 10);
      const user = repo.create({ email: email, password: hashed, role });

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

  async restore(id: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);

      const foundUser: User = await this.findByIdDeleted(id);

      if (!foundUser) throw new NotFoundException('user Not found');

      if (!foundUser.deletedAt) {
        throw new BadRequestException('User is not deleted!');
      }

      await repo.update({ id: id }, { deletedAt: null });

      const updatedUser: User | null = await repo.findOne({
        where: { id: id },
        relations: ['role'],
      });
      if (!updatedUser) throw new NotFoundException('updated user Not found');
    });
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);

      const foundUser: User = await this.findById(id);

      if (!foundUser) throw new NotFoundException('user Not found');

      if (foundUser.deletedAt) {
        throw new BadRequestException('User is already deleted');
      }

      await repo.softDelete({ id: id });

      const softDeletedUser: User | null = await repo.findOne({
        where: { id: id },
        relations: ['role'],
      });
      if (!softDeletedUser)
        throw new NotFoundException('updated user Not found');
    });
  }

  async update(
    id: string,
    updateData: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(User);

      const foundUser: User = await this.findById(id);

      if (!foundUser) throw new NotFoundException('user Not found');

      const emailExist = await this.emailExists(updateData.email);

      if (emailExist) {
        throw new BadRequestException('email already exists');
      }

      await repo.update({ id }, updateData);

      const updatedUser = await repo.findOne({
        where: { id },
        relations: ['role'],
        withDeleted: false,
      });

      if (!updatedUser) throw new NotFoundException('updated user Not found');

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        role: { name: updatedUser.role.name },
      };
    });
  }

  private async emailExists(email: string): Promise<boolean> {
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .select(['user.id', 'user.email', 'role.name'])
      .where('role.name = :roleName', { roleName: RoleName.USER })
      .andWhere('user.email = :email', { email })
      .withDeleted()
      .getOne();

    if (user) {
      return true;
    }

    return false;
  }
}
