import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './config/http-exception.filter';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { getCorsConfig } from './config/cors.config';
import helmet from 'helmet';
import { banner } from './utils/banner';
import { version as nestVersion } from '@nestjs/common/package.json';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);


  app.use(helmet());

  app.enableCors(getCorsConfig(configService));

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app, configService);

  dotenv.config();

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // convert strings to numbers/UUID automatically
    }),
  );

  await app.listen(configService.getOrThrow('APP_PORT') || 5000,'0.0.0.0'); // 00000 for docker networks
  const dataSource = app.get(DataSource);
  const result = await dataSource.query('SELECT version()');

  Logger.log(
    `
    ${banner}
   =======================================================                                                                                                                          
   🚀 Application ${configService.getOrThrow('APP_NAME')} Running! 
   ------------------------------------------------------------
   ▸ PORT : ${configService.getOrThrow('APP_PORT')} 
   ▸ PostgreSQL Version: ${result[0].version} 
   ▸ Node.js Version: ${process.version}
   ▸ NestJS Version: ${nestVersion}
   ▸ Grafana URL : ${configService.getOrThrow('DEV_URL')}:3000
   ▸ PgAdmin URL : ${configService.getOrThrow('DEV_URL')}:5050
   ▸ Mathesar URL : ${configService.getOrThrow('MATHESAR_DOMAIN_NAME')}
   ▸ RedisInsight URL ${configService.getOrThrow('DEV_URL')}:8001
   ▸ Redis PORT : ${configService.getOrThrow('REDIS_PORT')}
   ▸ ENV : ${configService.getOrThrow('NODE_ENV')}
   ${configService.getOrThrow('NODE_ENV') !== 'production' ? `▸ Swagger URL : ${configService.getOrThrow('DEV_URL')}:${configService.getOrThrow('APP_PORT')}/${configService.getOrThrow('SWAGGER_ROUTE')}` : ``}                                                                                                                          
   =======================================================`,
  );
}
bootstrap();
