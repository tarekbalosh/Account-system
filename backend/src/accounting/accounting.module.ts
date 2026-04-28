import { Module, Global } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  controllers: [AccountingController],
  providers: [AccountingService, PrismaService],
  exports: [AccountingService],
})
export class AccountingModule {}
