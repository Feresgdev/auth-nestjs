// src/users/user.seeder.ts
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { User } from './models/user.entity';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role } from '../shared/models/role.entity';
import { RoleName } from '../shared/enums/user_name.enum';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(private dataSource: DataSource) {}

  async seed(count = 50) {
    const roleRepo = this.dataSource.getRepository(Role);
    const userRepo = this.dataSource.getRepository(User);
    const alreadySeeded = await userRepo.count();

    const roles = [RoleName.VISITOR, RoleName.PREMIUM, RoleName.DEFAULT];
    for (const name of roles) {
      const existing = await roleRepo.findOne({ where: { name } });
      if (!existing) {
        await roleRepo.save(roleRepo.create({ name }));
        this.logger.log(`Role created: ${name}`);
      }
    }

    const superAdminRole = await roleRepo.findOne({
      where: { name: RoleName.PREMIUM },
    });
    const adminRole = await roleRepo.findOne({
      where: { name: RoleName.VISITOR },
    });
    const userRole = await roleRepo.findOne({
      where: { name: RoleName.DEFAULT },
    });

    if (!userRole) {
      throw new NotFoundException('error happened while fetching roles');
    }

    if (!adminRole) {
      throw new NotFoundException('error happened while fetching roles');
    }
    if (!superAdminRole) {
      throw new NotFoundException('error happened while fetching roles');
    }
    if (alreadySeeded === 0) {
      const knownUsers = [
        {
          email: 'user@example.com',
          password: 'pass123',
          roleId: userRole.id,
          isActive: true,
        },
        {
          email: 'admin@example.com',
          password: 'admin123',
          roleId: adminRole.id,
          isActive: true,
        },
        {
          email: 'superadmin@example.com',
          password: 'superadmin123',
          roleId: superAdminRole.id,
          isActive: true,
        },
      ];

      for (const u of knownUsers) {
        const existing = await userRepo.findOne({
          where: { email: u.email },
        });
        if (!existing) {
          const hashed = await bcrypt.hash(u.password, 10);
          const user = userRepo.create({
            email: u.email,
            password: hashed,
            roleId: userRole.id,
            isActive: u.isActive,
          });
          await userRepo.save(user);
          this.logger.log(
            `Known user created: ${u.email} | password: ${u.password}`,
          );
        } else {
          this.logger.log(`Known user already exists: ${u.email}, skipping.`);
        }
      }

      for (let i = 0; i < count; i++) {
        const email = faker.internet.email().toLowerCase();

        // skip if email already exists
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) {
          this.logger.log(`User with email ${email} already exists, skipping.`);
          continue;
        }

        const plain = faker.internet.password('8');
        const hashed = await bcrypt.hash(plain, 10);

        const user = userRepo.create({
          email,
          password: hashed,
          roleId: userRole.id,
        });
        await userRepo.save(user);
        this.logger.log(`User created: ${email} | password: ${plain}`);
      }

      this.logger.log(
        `Seeding complete. Total users requested: ${count} + 3 known users`,
      );
    } else {
      this.logger.debug('Users already Seeded!');
    }
  }
}
