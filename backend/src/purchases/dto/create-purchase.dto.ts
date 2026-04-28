// src/purchases/dto/create-purchase.dto.ts
import { IsString, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseDto {
  @IsString()
  supplier: string;

  @IsDateString()
  invoiceDate: string; // ISO date string

  @IsString()
  debitAccount: string;

  @IsString()
  creditAccount: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
