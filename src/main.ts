import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './config/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown props
      forbidNonWhitelisted: true, // throw error for extra props
      transform: true, // convert strings to numbers/UUID automatically
    }),
  );

  await app.listen(5000);
}
bootstrap();
