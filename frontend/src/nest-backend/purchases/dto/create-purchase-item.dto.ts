// src/purchases/dto/create-purchase-item.dto.ts
import { IsNumber, IsPositive } from 'class-validator';

export class CreatePurchaseItemDto {
  @IsNumber()
  materialId: number; // references InventoryItem.id

  @IsPositive()
  quantity: number;

  @IsNumber()
  unitCost: number; // cost per unit
}
