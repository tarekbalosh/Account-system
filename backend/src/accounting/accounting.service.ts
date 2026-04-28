import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AccountingService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedAccounts();
  }

  private async seedAccounts() {
    const defaultAccounts = [
      { name: 'Cash/Bank', code: '1001', type: 'ASSET' },
      { name: 'Accounts Receivable', code: '1201', type: 'ASSET' },
      { name: 'Accounts Payable', code: '2101', type: 'LIABILITY' },
      { name: 'Sales Revenue', code: '4001', type: 'REVENUE' },
      { name: 'Miscellaneous Revenue', code: '4999', type: 'REVENUE' },
      { name: 'Purchases', code: '5001', type: 'EXPENSE' },
      { name: 'General Expenses', code: '5999', type: 'EXPENSE' },
    ];

    for (const acc of defaultAccounts) {
      await this.prisma.account.upsert({
        where: { code: acc.code },
        update: {},
        create: acc,
      });
    }
  }

  async createTransaction(data: {
    description: string;
    reference?: string;
    date?: Date;
    debitAccount: string;
    creditAccount: string;
    amount: number;
  }, prismaInstance?: any) {
    const prisma = prismaInstance || this.prisma;
    
    return prisma.transaction.create({
      data: {
        description: data.description,
        reference: data.reference,
        date: data.date || new Date(),
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        amount: data.amount,
      },
    });
  }

  async recordSale(amount: number, debitAccount: string, creditAccount: string, reference: string, date: Date, prismaInstance?: any) {
    return this.createTransaction({
      description: `Sale transaction: ${reference}`,
      reference,
      date,
      debitAccount,
      creditAccount,
      amount,
    }, prismaInstance);
  }

  async recordPurchase(amount: number, debitAccount: string, creditAccount: string, reference: string, date: Date, prismaInstance?: any) {
    return this.createTransaction({
      description: `Purchase transaction: ${reference}`,
      reference,
      date,
      debitAccount,
      creditAccount,
      amount,
    }, prismaInstance);
  }

  async recordExpense(amount: number, description: string, reference: string, date: Date, prismaInstance?: any) {
    return this.createTransaction({
      description: `Expense: ${description}`,
      reference,
      date,
      debitAccount: 'General Expenses (5999)',
      creditAccount: 'Cash/Bank (1001)',
      amount,
    }, prismaInstance);
  }

  async recordRevenue(amount: number, description: string, reference: string, date: Date, prismaInstance?: any) {
    return this.createTransaction({
      description: `Revenue: ${description}`,
      reference,
      date,
      debitAccount: 'Cash/Bank (1001)',
      creditAccount: 'Miscellaneous Revenue (4999)',
      amount,
    }, prismaInstance);
  }
}
