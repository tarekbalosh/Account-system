// src/inventory/dto/create-inventory.dto.ts
import { IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}
