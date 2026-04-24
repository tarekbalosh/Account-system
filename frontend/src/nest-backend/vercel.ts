import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

let cachedApp: any;

export default async function handler(req: any, res: any) {
  console.log(`[API Request]: ${req.method} ${req.url}`);
  if (!cachedApp) {
    try {
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
      console.log('[API]: NestJS App Initialized');
    } catch (err) {
      console.error('[API Error]: Initialization failed', err);
      return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
  }
  
  const instance = cachedApp.getHttpAdapter().getInstance();
  return instance(req, res);
}
