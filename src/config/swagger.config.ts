import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(
  app: INestApplication,
  configuration: ConfigService,
) {
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation for my NestJS project')
    .setVersion('1.0')
    .addBearerAuth() // uncomment if you want JWT auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  configuration.getOrThrow('NODE_ENV') !== 'production' &&
    SwaggerModule.setup(
      configuration.getOrThrow('SWAGGER_ROUTE'),
      app,
      document,
    );
}
