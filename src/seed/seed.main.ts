import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

@Module({
  imports: [ConfigModule, SeedModule],
})
class SeedAppModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedAppModule);

  try {
    const seedService = app.get(SeedService);
    await seedService.seed();
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('خطا در اجرای سیدر:', error);
  process.exit(1);
});
