import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

let cachedApp: any;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await NestFactory.create(AppModule);
    cachedApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    cachedApp.setGlobalPrefix('api');
    cachedApp.use(helmet({
      crossOriginResourcePolicy: false,
    }));
    cachedApp.enableCors({
      origin: true,
      credentials: true,
    });
    await cachedApp.init();
  }
  
  const instance = cachedApp.getHttpAdapter().getInstance();
  return instance(req, res);
}
