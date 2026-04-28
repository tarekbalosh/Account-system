import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from '@prisma/client';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  async create(dto: CreateSaleDto, userId: number): Promise<Sale> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Check stock for all items
      for (const item of dto.items) {
        const inventory = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryId } });
        if (!inventory) {
          throw new BadRequestException(`Inventory item with id ${item.inventoryId} not found`);
        }
        if (inventory.quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for item "${inventory.name}". Available: ${inventory.quantity}, Required: ${item.quantity}`);
        }
      }

      // 2. Create Sale record
      const sale = await prisma.sale.create({
        data: {
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
          paymentType: dto.paymentType || 'Cash',
          user: { connect: { id: userId } },
        },
      });

      // 3. Create sale items and update inventory
      for (const item of dto.items) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
          },
        });

        await prisma.inventoryItem.update({
          where: { id: item.inventoryId },
          data: { quantity: { decrement: item.quantity } },
        });

        await prisma.inventoryLog.create({
          data: {
            inventoryId: item.inventoryId,
            operationType: 'SALE',
            quantityDiff: -item.quantity,
          },
        });
      }

      // 4. Record Accounting Transaction
      await this.accounting.recordSale(
        sale.amount,
        dto.debitAccount || 'Cash/Bank (1001)',
        dto.creditAccount || 'Sales Revenue (4001)',
        `Sale #${sale.id}`,
        sale.date,
        prisma
      );

      return sale;
    });
  }

  async findAll() {
    console.log('SalesService.findAll called');
    try {
      const result = await this.prisma.sale.findMany({
        include: {
          items: {
            include: { inventory: true }
          }
        }
      });
      console.log('SalesService.findAll success, count:', result.length);
      return result;
    } catch (error) {
      console.error('SalesService.findAll failed:', error);
      throw error;
    }
  }

  async getSummary(period: 'daily' | 'monthly'): Promise<any[]> {
    console.log('SalesService.getSummary called with period:', period);
    try {
      const sales = await this.prisma.sale.findMany({
        orderBy: { date: 'asc' },
      });
      console.log('SalesService.getSummary found sales:', sales.length);

    const groups = new Map<string, number>();

    sales.forEach(s => {
      const key = period === 'daily' 
        ? s.date.toISOString().split('T')[0] 
        : `${s.date.getFullYear()}-${(s.date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      groups.set(key, (groups.get(key) || 0) + Number(s.amount));
    });

      const result = Array.from(groups.entries()).map(([period, total]) => ({
        period,
        total,
      }));
      console.log('SalesService.getSummary success');
      return result;
    } catch (error) {
      console.error('SalesService.getSummary failed:', error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateSaleDto, userId: number): Promise<Sale> {
    const existing = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!existing) {
      throw new NotFoundException('Sale record not found');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Reverse old items
      for (const item of existing.items) {
        await prisma.inventoryItem.update({
          where: { id: item.inventoryId },
          data: { quantity: { increment: item.quantity } },
        });
        await prisma.inventoryLog.create({
          data: {
            inventoryId: item.inventoryId,
            operationType: 'UPDATE_REVERSAL',
            quantityDiff: item.quantity,
          },
        });
      }

      // 2. Check stock for new items
      const itemsToApply = dto.items ?? existing.items.map(i => ({
        inventoryId: i.inventoryId,
        quantity: i.quantity
      }));

      for (const item of itemsToApply) {
        const inventory = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryId } });
        if (!inventory || inventory.quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for item ID ${item.inventoryId} after adjustment`);
        }
      }

      // 3. Delete old items
      await prisma.saleItem.deleteMany({ where: { saleId: id } });

      // 4. Update Sale header
      const updated = await prisma.sale.update({
        where: { id },
        data: {
          amount: dto.amount !== undefined ? dto.amount : existing.amount,
          date: dto.date ? new Date(dto.date) : existing.date,
          description: dto.description !== undefined ? dto.description : existing.description,
          paymentType: dto.paymentType !== undefined ? dto.paymentType : existing.paymentType,
          user: { connect: { id: userId } },
        },
      });

      // 5. Create new items and apply quantities
      for (const item of itemsToApply) {
        await prisma.saleItem.create({
          data: {
            saleId: id,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
          },
        });

        await prisma.inventoryItem.update({
          where: { id: item.inventoryId },
          data: { quantity: { decrement: item.quantity } },
        });

        await prisma.inventoryLog.create({
          data: {
            inventoryId: item.inventoryId,
            operationType: 'UPDATE_ADJUSTMENT',
            quantityDiff: -item.quantity,
          },
        });
      }

      return updated;
    });
  }

  async delete(id: number): Promise<Sale> {
    const existing = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!existing) {
      throw new NotFoundException('Sale record not found');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Reverse effect on inventory
      for (const item of existing.items) {
        await prisma.inventoryItem.update({
          where: { id: item.inventoryId },
          data: { quantity: { increment: item.quantity } },
        });
        await prisma.inventoryLog.create({
          data: {
            inventoryId: item.inventoryId,
            operationType: 'DELETE',
            quantityDiff: item.quantity,
          },
        });
      }
      return prisma.sale.delete({ where: { id } });
    });
  }
}
