import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create_user.dto';
import { UserResponseDto } from 'src/user/dto/user_response.dto';
import RoleName from 'src/user/enums/user_name.enum';
import { Role } from 'src/user/models/role.entity';
import { User } from 'src/user/models/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private dataSource: DataSource) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
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

      const role = await roleRepo.findOne({ where: { name: RoleName.ADMIN } });
      if (!role) throw new NotFoundException('Admin role not found');

      const hashed = await bcrypt.hash(dto.password, 10);
      const admin = repo.create({ email: dto.email, password: hashed, role });

      const savedAdmin = await repo.save(admin);

      return {
        id: savedAdmin.id,
        email: savedAdmin.email,
        createdAt: savedAdmin.createdAt,
        updatedAt: savedAdmin.updatedAt,
        role: { name: savedAdmin.role.name },
      };
    });
  }
}
