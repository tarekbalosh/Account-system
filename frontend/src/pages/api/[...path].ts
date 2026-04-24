import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../nest-backend/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NextApiRequest, NextApiResponse } from 'next';

let cachedApp: any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true,
      transform: true 
    }));
    app.enableCors();
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }

  // Handle the request through the NestJS/Express instance
  return cachedApp(req, res);
}

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false, // NestJS handles its own body parsing
  },
};
