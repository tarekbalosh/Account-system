import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('transactions')
  async getTransactions() {
    return this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
  }

  @Post('transactions')
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.accountingService.createTransaction({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
    });
  }

  @Get('accounts')
  async getAccounts() {
    return this.prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }
}
