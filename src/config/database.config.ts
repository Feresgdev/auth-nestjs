// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST') || 'localhost',
  port: Number(configService.get<number>('DB_PORT')) || 5432,
  username: configService.get<string>('DB_USER') || 'postgres',
  password: configService.get<string>('DB_PASSWORD') || 'password',
  database: configService.get<string>('DB_NAME') || 'mydb',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: true,
});
