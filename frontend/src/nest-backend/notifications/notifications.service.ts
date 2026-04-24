// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAlerts() {
    const alerts = [];
    
    // Check for high expenses (e.g., current month > previous month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const currentExpenses = await this.prisma.expense.aggregate({
      where: { date: { gte: lastMonth } },
      _sum: { amount: true },
    });

    const previousExpenses = await this.prisma.expense.aggregate({
      where: { date: { gte: twoMonthsAgo, lt: lastMonth } },
      _sum: { amount: true },
    });

    const currExp = Number(currentExpenses._sum.amount) || 0;
    const prevExp = Number(previousExpenses._sum.amount) || 0;

    if (prevExp > 0 && currExp > prevExp * 1.25) {
      alerts.push({
        type: 'WARNING',
        message: `High Expenses: Current month expenses (${currExp.toFixed(2)}) are 25%+ higher than previous month (${prevExp.toFixed(2)}).`,
      });
    }

    // Check for profit drop
    const currentRevenue = await this.prisma.revenue.aggregate({
      where: { date: { gte: lastMonth } },
      _sum: { amount: true },
    });
    const prevRevenue = await this.prisma.revenue.aggregate({
      where: { date: { gte: twoMonthsAgo, lt: lastMonth } },
      _sum: { amount: true },
    });

    const currProfit = (Number(currentRevenue._sum.amount) || 0) - currExp;
    const prevProfit = (Number(prevRevenue._sum.amount) || 0) - prevExp;

    if (prevProfit > 0 && currProfit < prevProfit * 0.75) {
      alerts.push({
        type: 'CRITICAL',
        message: `Profit Drop: Current month profit (${currProfit.toFixed(2)}) has dropped 25%+ compared to previous month (${prevProfit.toFixed(2)}).`,
      });
    }

    // Check for low stock inventory
    const lowStockItems = await this.prisma.inventoryItem.findMany({
      where: { quantity: { lt: 5 } },
    });

    lowStockItems.forEach(item => {
      alerts.push({
        type: 'WARNING',
        message: `Low Stock: "${item.name}" is running low (${item.quantity} remaining).`,
      });
    });

    return alerts;
  }
}
