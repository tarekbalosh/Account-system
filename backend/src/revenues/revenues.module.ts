// src/revenues/revenues.module.ts
import { Module } from '@nestjs/common';
import { RevenuesService } from './revenues.service';
import { RevenuesController } from './revenues.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [RevenuesService, PrismaService],
  controllers: [RevenuesController],
})
export class RevenuesModule {}
