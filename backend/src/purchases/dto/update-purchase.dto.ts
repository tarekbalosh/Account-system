// src/purchases/dto/update-purchase.dto.ts
import { IsString, IsDateString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class UpdatePurchaseDto {
  @IsString()
  @IsOptional()
  supplier?: string;

  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items?: CreatePurchaseItemDto[];
}
