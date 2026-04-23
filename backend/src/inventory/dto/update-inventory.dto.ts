// src/inventory/dto/update-inventory.dto.ts
import { IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;
}
