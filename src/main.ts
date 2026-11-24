import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());

  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!corsOrigins?.length) {
    throw new Error('CORS_ORIGINS environment variable is required');
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Disable Swagger in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('فروشگاه اینترنتی API')
      .setDescription('مستندات API فروشگاه اینترنتی با NestJS و MySQL')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'توكن JWT را وارد کنید',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  Logger.log(`API در حال اجرا روی http://localhost:${port}`, 'Bootstrap');
  if (process.env.NODE_ENV !== 'production') {
    Logger.log(
      `Swagger در دسترس است روی http://localhost:${port}/api`,
      'Bootstrap',
    );
  }
}

bootstrap().catch((error) => {
  Logger.error('راه‌اندازی برنامه با خطا مواجه شد', error, 'Bootstrap');
  process.exit(1);
});