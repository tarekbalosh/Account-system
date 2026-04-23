// src/expenses/dto/create-expense.dto.ts
import { IsNumber, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';


export class CreateExpenseDto {
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
}
