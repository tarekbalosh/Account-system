// src/revenues/dto/create-revenue.dto.ts
import { IsNumber, IsOptional, IsString, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRevenueItemDto } from './create-revenue-item.dto';

export class CreateRevenueDto {
  @IsNumber()
  amount: number;

  @IsDateString()
  date: string; // ISO date string

  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRevenueItemDto)
  items?: CreateRevenueItemDto[];
}
