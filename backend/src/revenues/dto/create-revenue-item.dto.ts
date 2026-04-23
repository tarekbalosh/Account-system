// src/revenues/dto/create-revenue-item.dto.ts
import { IsNumber, IsPositive } from 'class-validator';

export class CreateRevenueItemDto {
  @IsNumber()
  inventoryId: number; // references InventoryItem.id

  @IsPositive()
  @IsNumber()
  quantity: number;
}
