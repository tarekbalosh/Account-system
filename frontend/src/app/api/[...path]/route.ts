import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../nest-backend/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NextRequest } from 'next/server';

let cachedApp: any;

async function getApp() {
  if (!cachedApp) {
    cachedApp = await NestFactory.create(AppModule);
    cachedApp.setGlobalPrefix('api');
    cachedApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    cachedApp.enableCors();
    await cachedApp.init();
  }
  return cachedApp;
}

export async function GET(request: NextRequest) {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(request, request); // This is a simplified proxy
}

export async function POST(request: NextRequest) {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(request, request);
}

// Add other methods as needed (PUT, DELETE, etc.)
export async function PUT(request: NextRequest) {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(request, request);
}

export async function DELETE(request: NextRequest) {
  const app = await getApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(request, request);
}
