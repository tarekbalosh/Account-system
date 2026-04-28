// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Add a simple logger middleware
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    console.log(`[DEBUG] Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend listening on http://localhost:${port}`);
}
bootstrap();
