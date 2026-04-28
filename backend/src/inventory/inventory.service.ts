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



  async delete(id: number): Promise<InventoryItem> {
    const existing = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }
    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
