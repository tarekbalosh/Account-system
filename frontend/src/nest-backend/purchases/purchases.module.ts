// src/purchases/purchases.module.ts
import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PurchasesService, PrismaService],
  controllers: [PurchasesController],
})
export class PurchasesModule {}
