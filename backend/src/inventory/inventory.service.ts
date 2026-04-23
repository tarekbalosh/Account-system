// src/inventory/inventory.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { InventoryItem } from '@prisma/client';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryDto, userId: number): Promise<InventoryItem> {
    const existing = await this.prisma.inventoryItem.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException('Inventory item with this name already exists');
    }
    return this.prisma.inventoryItem.create({
      data: {
        name: dto.name,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        user: { connect: { id: userId } },
      },
    });
  }

  async findAll(): Promise<InventoryItem[]> {
    return this.prisma.inventoryItem.findMany();
  }

  async findOne(id: number): Promise<InventoryItem> {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    return item;
  }

  async update(id: number, dto: UpdateInventoryDto, userId: number): Promise<InventoryItem> {
    const existing = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }
    if (dto.name) {
      const duplicate = await this.prisma.inventoryItem.findUnique({ where: { name: dto.name } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Another inventory item with this name already exists');
      }
    }
    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        name: dto.name,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        unitCost: dto.unitCost !== undefined ? dto.unitCost : undefined,
        user: { connect: { id: userId } },
      },
    });
  }

  async withdraw(id: number, quantity: number, userId: number): Promise<InventoryItem> {
    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.inventoryItem.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Inventory item not found');
      }

      if (existing.quantity < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${existing.quantity}, Requested: ${quantity}`);
      }

      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
          quantity: { decrement: quantity },
        },
      });

      // 1. Ensure "Consumption Materials" category exists
      let category = await prisma.expenseCategory.findUnique({
        where: { name: 'Consumption Materials' }
      });
      
      if (!category) {
        category = await prisma.expenseCategory.create({
          data: { name: 'Consumption Materials' }
        });
      }

      // 2. Create Expense record for the withdrawal
      const totalCost = quantity * existing.unitCost;
      await prisma.expense.create({
        data: {
          amount: totalCost,
          date: new Date(),
          description: `Withdrawal: ${quantity} units of ${existing.name}`,
          category: { connect: { id: category.id } },
          user: { connect: { id: userId } },
        }
      });

      // 3. Log the manual withdrawal
      await prisma.inventoryLog.create({
        data: {
          inventoryId: id,
          operationType: 'MANUAL_WITHDRAWAL',
          quantityDiff: -quantity,
        },
      });

      return updated;
    });
  }

  async delete(id: number): Promise<InventoryItem> {
    const existing = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }
    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
