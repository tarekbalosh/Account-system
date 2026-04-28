import { IsString, IsNumber, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  debitAccount: string;

  @IsNotEmpty()
  @IsString()
  creditAccount: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
