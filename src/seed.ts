import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './user/user.seeder';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(UserSeeder);
    await seeder.seed();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();
