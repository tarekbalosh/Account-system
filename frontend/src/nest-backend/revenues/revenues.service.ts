// src/revenues/revenues.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { Revenue } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class RevenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRevenueDto, userId: number): Promise<Revenue> {
    // Validate category existence if provided
    if (dto.categoryId) {
      const cat = await this.prisma.revenueCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) {
        throw new BadRequestException('Revenue category not found');
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Check stock for all items
      if (dto.items) {
        for (const item of dto.items) {
          const inventory = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryId } });
          if (!inventory) {
            throw new BadRequestException(`Inventory item with id ${item.inventoryId} not found`);
          }
          if (inventory.quantity < item.quantity) {
            throw new BadRequestException(`Insufficient stock for item "${inventory.name}". Available: ${inventory.quantity}, Required: ${item.quantity}`);
          }
        }
      }

      // 2. Create Revenue record
      const revenue = await prisma.revenue.create({
        data: {
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
          category: { connect: { id: dto.categoryId } },
          user: { connect: { id: userId } },
        },
      });

      // 3. Create items and update inventory
      if (dto.items) {
        for (const item of dto.items) {
          await prisma.revenueItem.create({
            data: {
              revenueId: revenue.id,
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
      }

      return revenue;
    });
  }

  async findAll(params?: { from?: string; to?: string; categoryId?: number }): Promise<Revenue[]> {
    const where: Prisma.RevenueWhereInput = {};
    if (params?.from || params?.to) {
      where.date = {};
      if (params.from) where.date.gte = new Date(params.from);
      if (params.to) where.date.lte = new Date(params.to);
    }
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }
    return this.prisma.revenue.findMany({ 
      where, 
      include: { 
        category: true,
        items: { include: { inventory: true } }
      } 
    });
  }

  async getSummary(period: 'daily' | 'monthly'): Promise<any[]> {
    const revenues = await this.prisma.revenue.findMany({
      orderBy: { date: 'asc' },
    });

    const groups = new Map<string, number>();

    revenues.forEach(r => {
      const key = period === 'daily' 
        ? r.date.toISOString().split('T')[0] 
        : `${r.date.getFullYear()}-${(r.date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      groups.set(key, (groups.get(key) || 0) + Number(r.amount));
    });

    return Array.from(groups.entries()).map(([period, total]) => ({
      period,
      total,
    }));
  }

  async update(id: number, dto: UpdateRevenueDto, userId: number): Promise<Revenue> {
    const existing = await this.prisma.revenue.findUnique({ 
      where: { id },
      include: { items: true }
    });
    if (!existing) {
      throw new NotFoundException('Revenue record not found');
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
      await prisma.revenueItem.deleteMany({ where: { revenueId: id } });

      // 4. Update Revenue header
      const updated = await prisma.revenue.update({
        where: { id },
        data: {
          amount: dto.amount !== undefined ? dto.amount : existing.amount,
          date: dto.date ? new Date(dto.date) : existing.date,
          description: dto.description !== undefined ? dto.description : existing.description,
          category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined as any,
          user: { connect: { id: userId } },
        },
      });

      // 5. Create new items and apply quantities
      for (const item of itemsToApply) {
        await prisma.revenueItem.create({
          data: {
            revenueId: id,
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

  async delete(id: number): Promise<Revenue> {
    const existing = await this.prisma.revenue.findUnique({ 
      where: { id },
      include: { items: true }
    });
    if (!existing) {
      throw new NotFoundException('Revenue record not found');
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
      return prisma.revenue.delete({ where: { id } });
    });
  }

  async findAllCategories() {
    return this.prisma.revenueCategory.findMany();
  }
}
