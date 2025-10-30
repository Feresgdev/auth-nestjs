import { Module } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSeeder } from './user/user.seeder';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),

    UserModule,
    AuthModule,
    AdminModule,
  ],

  controllers: [],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class AppModule {}
