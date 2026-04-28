// src/expenses/expenses.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Expense, Prisma } from '@prisma/client';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  async create(dto: CreateExpenseDto, userId: number): Promise<Expense> {
    if (dto.categoryId) {
      const cat = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) {
        throw new BadRequestException('Expense category not found');
      }
    }
    return this.prisma.$transaction(async (prisma) => {
      const expense = await prisma.expense.create({
        data: {
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
          category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
          user: { connect: { id: userId } },
        },
      });

      await this.accounting.recordExpense(
        expense.amount,
        expense.description || 'No description',
        `Expense #${expense.id}`,
        expense.date,
        prisma
      );

      return expense;
    });
  }

  async findAll(params?: { from?: string; to?: string; categoryId?: number }): Promise<Expense[]> {
    const where: Prisma.ExpenseWhereInput = {};
    if (params?.from || params?.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }
    return this.prisma.expense.findMany({ where, include: { category: true } });
  }

  async update(id: number, dto: Partial<CreateExpenseDto>, userId: number): Promise<Expense> {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Expense not found');
    }
    if (dto.categoryId) {
      const cat = await this.prisma.expenseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) {
        throw new BadRequestException('Expense category not found');
      }
    }
    return this.prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount !== undefined ? dto.amount : undefined,
        date: dto.date ? new Date(dto.date) : undefined,
        description: dto.description,
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        user: { connect: { id: userId } },
      },
    });
  }

  async delete(id: number): Promise<Expense> {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Expense not found');
    }
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(period: 'daily' | 'monthly'): Promise<any[]> {
    const expenses = await this.prisma.expense.findMany({
      orderBy: { date: 'asc' },
    });

    const groups = new Map<string, number>();

    expenses.forEach(e => {
      const key = period === 'daily' 
        ? e.date.toISOString().split('T')[0] 
        : `${e.date.getFullYear()}-${(e.date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      groups.set(key, (groups.get(key) || 0) + Number(e.amount));
    });

    return Array.from(groups.entries()).map(([period, total]) => ({
      period,
      total,
    }));
  }

  async findAllCategories() {
    return this.prisma.expenseCategory.findMany();
  }
}
