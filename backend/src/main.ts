import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ✅ Global API prefix
  app.setGlobalPrefix('api/v1');

  // ✅ Enable CORS with env-based origins
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ✅ Serve static files (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
}
bootstrap();
