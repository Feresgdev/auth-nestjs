import { Module } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSeeder } from './user/user.seeder';
import { SystemModule } from './system/system.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),

    UserModule,
    AuthModule,
    SystemModule,
    EmailModule,
    FirebaseModule,
  ],

  controllers: [],
  providers: [UserSeeder],
  exports: [UserSeeder],
})
export class AppModule {}
