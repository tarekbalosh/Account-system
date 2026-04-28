// src/purchases/purchases.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase } from '@prisma/client';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: number): Promise<Purchase> {
    // Validate each line item references an existing inventory material
    for (const item of dto.items) {
      const material = await this.prisma.inventoryItem.findUnique({ where: { id: item.materialId } });
      if (!material) {
        throw new BadRequestException(`Inventory material with id ${item.materialId} not found`);
      }
    }

    const total = dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

    return this.prisma.$transaction(async (prisma) => {
      const purchase = await prisma.purchase.create({
        data: {
          supplier: dto.supplier,
          invoiceDate: new Date(dto.invoiceDate),
          totalAmount: total,
          user: { connect: { id: userId } },
        },
      });

      for (const item of dto.items) {
        await prisma.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            materialId: item.materialId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
        });

        await this.applyInventoryAdjustment(prisma, item.materialId, item.quantity, item.unitCost, 'PURCHASE');
      }

      // Record Accounting Transaction
      await this.accounting.recordPurchase(
        purchase.totalAmount,
        dto.debitAccount,
        dto.creditAccount,
        `Purchase #${purchase.id}`,
        purchase.invoiceDate,
        prisma
      );

      return purchase;
    });
  }

  async update(id: number, dto: UpdatePurchaseDto): Promise<Purchase> {
    const existing = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    return this.prisma.$transaction(async (prisma) => {
      // 1. Reverse old items (quantity and cost adjustment)
      for (const item of existing.items) {
        await this.applyInventoryAdjustment(prisma, item.materialId, -item.quantity, item.unitCost, 'UPDATE_REVERSAL');
      }

      // 2. Delete old items
      await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });

      // 3. Update purchase header
      const total = dto.items 
        ? dto.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)
        : existing.totalAmount;

      const updated = await prisma.purchase.update({
        where: { id },
        data: {
          supplier: dto.supplier ?? existing.supplier,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : existing.invoiceDate,
          totalAmount: total,
        },
      });

      // 4. Create new items and apply new quantities/costs
      const itemsToCreate = dto.items ?? existing.items.map(i => ({
        materialId: i.materialId,
        quantity: i.quantity,
        unitCost: i.unitCost
      }));

      for (const item of itemsToCreate) {
        await prisma.purchaseItem.create({
          data: {
            purchaseId: id,
            materialId: item.materialId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          },
        });

        await this.applyInventoryAdjustment(prisma, item.materialId, item.quantity, item.unitCost, 'UPDATE_ADJUSTMENT');
      }

      return updated;
    });
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Purchase not found');

    await this.prisma.$transaction(async (prisma) => {
      // Reverse effect on inventory
      for (const item of existing.items) {
        await this.applyInventoryAdjustment(prisma, item.materialId, -item.quantity, item.unitCost, 'DELETE');
      }
      // Delete purchase
      await prisma.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await prisma.purchase.delete({ where: { id } });
    });
  }

  private async applyInventoryAdjustment(
    prisma: any, 
    materialId: number, 
    qtyDiff: number, 
    unitCost: number,
    operationType: string
  ) {
    const material = await prisma.inventoryItem.findUnique({ where: { id: materialId } });
    if (!material) return;

    const currentQty = material.quantity;
    const currentCost = material.unitCost;
    
    const newQty = currentQty + qtyDiff;
    let newAverageCost = currentCost;

    if (newQty > 0) {
      if (qtyDiff > 0) {
        // Acquisition: Update average cost
        newAverageCost = ((currentQty * currentCost) + (qtyDiff * unitCost)) / newQty;
      } else if (qtyDiff < 0) {
        // Reversal/Deletion: Recalculate based on remaining value
        // Use the formula to "undo" the cost contribution if possible, 
        // or just keep current cost if we are reducing.
        // Actually, in a standard weighted average, reducing stock doesn't change unit cost.
        // But if we are reversing a purchase, we want to go back towards the old cost.
        const newValue = (currentQty * currentCost) + (qtyDiff * unitCost); 
        newAverageCost = newValue / newQty;
      }
    } else {
      // If inventory drops to 0 or below, we can either keep the last cost or reset it.
      // Resetting to the latest unit cost provided might be more useful for next purchases.
      newAverageCost = unitCost;
    }

    await prisma.inventoryItem.update({
      where: { id: materialId },
      data: { 
        quantity: newQty < 0 ? 0 : newQty, // Prevent negative inventory if possible
        unitCost: Math.round(newAverageCost * 100) / 100
      },
    });

    await prisma.inventoryLog.create({
      data: {
        inventoryId: materialId,
        operationType: operationType,
        quantityDiff: qtyDiff,
      },
    });
  }

  async findAll(): Promise<Purchase[]> {
    return this.prisma.purchase.findMany({
      include: { items: { include: { material: true } } },
    });
  }

  async findOne(id: number): Promise<Purchase> {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: { items: { include: { material: true } } },
    });
    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }
    return purchase;
  }
}
