import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './models/user.entity';
import { Role } from '../shared/models/role.entity';
import * as bcrypt from 'bcrypt';

import { UserResponseDto } from './dto/user_response.dto';
import { RoleName } from '../shared/enums/user_name.enum';
import { UpdateUserDto } from './dto/update_user.dto';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ResetPasswordToken } from './models/reset_password_token.entity';
import { ActivationToken } from './models/activation_token.entity';
import { UserFields } from './types/fields.type';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private dataSource: DataSource,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findById(id: string, fields?: UserFields): Promise<User> {
    this.logger.debug(`Finding user with Id : ${id}`);
    try {
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

        .getOne();

      console.log(id);
      if (!user) {
        this.logger.error(`User not found with Id : ${id}`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findByIdDeleted(id: string): Promise<User> {
    this.logger.debug(`Finding user with Id : ${id}`);
    try {
      const user = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select(['user.id', 'user.email', 'role.name'])
        .where('user.id = :id', { id })

        .withDeleted()
        .getOne();
      if (!user) {
        this.logger.error(`User not found with Id : ${id}`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .select(['user.id', 'user.email', 'role.name'])

        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { data: users, total, page, limit };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findAllDeleted(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .select(['user.id', 'user.email', 'role.name'])

        .andWhere('user.deletedAt != NULL')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { data: users, total, page, limit };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findAllNonDeleted(
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .select(['user.id', 'user.email', 'role.name'])
        .andWhere('user.deletedAt = NULL')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { data: users, total, page, limit };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findByEmail(email: string): Promise<User> {
    this.logger.debug(`Finding user with email : ${email}`);
    try {
      const user = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .leftJoin('user.role', 'role')
        .select([
          'user.id',
          'user.email',
          'user.password',
          'user.createdAt',
          'user.updatedAt',
          'role.name',
        ])
        .where('user.email = :email', { email })

        .getOne();
      if (!user) {
        this.logger.error(`User not found with email : ${email}`);
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return user;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findByActivationToken(token: string): Promise<User> {
    this.logger.debug(`Finding user with token : ${token}`);
    try {
      const activationToken: ActivationToken | null = await this.dataSource
        .getRepository(ActivationToken)
        .createQueryBuilder('activationToken')
        .leftJoinAndSelect('activationToken.user', 'user')
        .where('token = :token', { token })
        .getOne();
      if (!activationToken) {
        this.logger.error(`User not found with token : ${token}`);
        throw new NotFoundException(`User with token ${token} not found`);
      }
      return activationToken.user;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findActivationTokenByToken(token: string): Promise<ActivationToken> {
    try {
      const activationTokenRepo =
        this.dataSource.getRepository(ActivationToken);

      const foundActivationToken: ActivationToken | null =
        await activationTokenRepo.findOne({ where: { token } });

      if (!foundActivationToken) {
        this.logger.error(`Activation token not found with token ${token}`);
        throw new NotFoundException(
          `Activation token not found with token ${token}`,
        );
      }

      return foundActivationToken;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async findByResetToken(token: string): Promise<User> {
    try {
      this.logger.debug(`Finding user with reset token : ${token}`);
      const resetPasswordToken: ResetPasswordToken | null =
        await this.dataSource
          .getRepository(ResetPasswordToken)
          .createQueryBuilder('resetPassword')
          .leftJoinAndSelect('resetPassword.user', 'user')
          .getOne();
      if (!resetPasswordToken) {
        this.logger.error(`Reset password not found with token : ${token}`);
        throw new NotFoundException(
          `Reset password not found with token :${token}`,
        );
      }

      if (!resetPasswordToken.user) {
        this.logger.error(`User not found with token : ${token}`);
        throw new NotFoundException(`User with token ${token} not found`);
      }
      return resetPasswordToken.user;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async create(
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<UserResponseDto> {
    try {
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

        const role = await roleRepo.findOne({
          where: { name: RoleName.DEFAULT },
        });
        if (!role) throw new NotFoundException('Default role User not found');

        const activationToken = randomBytes(32).toString('hex');

        const hashed = await bcrypt.hash(password, 10);
        const user = repo.create({
          email: email,
          password: hashed,
          role,
        });

        const savedUser = await repo.save(user);

        await this.emailService.sendActivationEmail(email, activationToken);

        return {
          id: savedUser.id,
          email: savedUser.email,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
          role: { name: savedUser.role.name },
        };
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async createPasswordResetToken(
    userId: string,
    resetToken: string,
    resetTokenExpiry: Date,
  ): Promise<void> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const resetPasswordRepo = manager.getRepository(ResetPasswordToken);

        const foundUser: User = await this.findById(userId);

        const newResetToken = resetPasswordRepo.create({
          userId: foundUser.id,
          expires: resetTokenExpiry,
          token: resetToken,
        });

        await resetPasswordRepo.save(newResetToken);
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async createActivationToken(
    userId: string,
    activationToken: string,
    resetTokenExpiry: Date,
  ): Promise<void> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const activationTokenRepo = manager.getRepository(ActivationToken);

        const foundUser: User = await this.findById(userId);

        const newactivationToken = activationTokenRepo.create({
          userId: foundUser.id,
          expires: resetTokenExpiry,
          token: activationToken,
        });

        await activationTokenRepo.save(newactivationToken);
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async restore(id: string): Promise<void> {
    try {
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async update(
    id: string,
    updateData: UpdateUserDto,
    file?: File,
  ): Promise<UserResponseDto> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(User);

        const foundUser: User = await this.findById(id);

        if (!foundUser) throw new NotFoundException('user Not found');

        if (updateData.email) {
          const emailExist = await this.emailExists(updateData.email);
          if (emailExist) {
            throw new BadRequestException('Email already in use');
          }
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async updateRefreshToken(
    id: string,
    newRefreshToken: string | null,
  ): Promise<void> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(User);

        const foundUser: User = await this.findById(id);

        if (!foundUser) throw new NotFoundException('user Not found');

        await repo.update({ id }, { refreshToken: newRefreshToken! });

        const updatedUser = await repo.findOne({
          where: { id },
          relations: ['role'],
          withDeleted: false,
        });

        if (!updatedUser) throw new NotFoundException('updated user Not found');
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async updatePasswordAndResetToken(
    userId: string,
    token: string,
    newHashedPassword: string,
  ): Promise<void> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const resetPasswordRepo = manager.getRepository(ResetPasswordToken);

        const [foundResetPassword, foundUser] = await Promise.all([
          resetPasswordRepo.findOne({
            where: { token, userId },
          }),
          this.findById(userId),
        ]);

        if (!foundUser) throw new NotFoundException('user Not found');
        if (!foundResetPassword)
          throw new NotFoundException('resetPasswordNotFound Not found');

        if (foundResetPassword.expires < new Date()) {
          throw new BadRequestException('Invalid or expired reset token');
        }

        if (foundResetPassword.isUsed) {
          throw new BadRequestException('Invalid or expired reset token');
        }

        await resetPasswordRepo.update(
          { id: foundResetPassword.id },
          {
            isUsed: true,
          },
        );

        await userRepo.update(
          { id: userId },
          {
            password: newHashedPassword,
          },
        );
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async activateUser(userId: string, token: string): Promise<User> {
    try {
      return this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const activationRepo = manager.getRepository(ActivationToken);

        const foundUser: User = await this.findById(userId);
        const foundActivationToken: ActivationToken =
          await this.findActivationTokenByToken(token);

        if (foundActivationToken.isUsed) {
          throw new BadRequestException('user account already used!');
        }

        if (foundUser.isActive) {
          throw new BadRequestException('user account already activated');
        }

        await activationRepo.update({ userId }, { isUsed: true });

        await userRepo.update(
          { id: userId },
          {
            isActive: true,
          },
        );

        const updatedUser = await userRepo.findOne({
          where: { id: userId },
          relations: ['role'],
          withDeleted: false,
        });

        if (!updatedUser) throw new NotFoundException('updated user Not found');

        return updatedUser;
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async isDeleted(userId: string): Promise<boolean> {
    try {
      const foundUser: User | null = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .select(['user.id', 'user.deletedAt'])
        .where('user.id = :id', { id: userId })
        .withDeleted()
        .getOne();
      if (!foundUser) {
        this.logger.error(`User not found with Id : ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (foundUser.deletedAt) {
        return true;
      }

      return false;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async isActive(userId: string): Promise<boolean> {
    try {
      const foundUser: User | null = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .select(['user.id', 'user.isActive'])
        .where('user.id = :id', { id: userId })
        .withDeleted()
        .getOne();

      if (!foundUser) {
        throw new NotFoundException('user not found!');
      }

      if (foundUser.isActive) {
        return true;
      }

      return false;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  private async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .select(['user.id', 'user.email', 'role.name'])
        .andWhere('user.email = :email', { email })
        .withDeleted()
        .getOne();

      if (user) {
        return true;
      }

      return false;
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }
}
