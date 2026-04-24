// src/expenses/expenses.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACCOUNTANT')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Body() dto: CreateExpenseDto, @User('userId') userId: number) {
    return this.expensesService.create(dto, userId);
  }

  @Get()
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.expensesService.findAll({
      from,
      to,
      categoryId: categoryId ? Number(categoryId) : undefined,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>, @User('userId') userId: number) {
    return this.expensesService.update(Number(id), dto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.expensesService.delete(Number(id));
  }

  @Get('summary')
  async getSummary(@Query('period') period: 'daily' | 'monthly' = 'daily') {
    return this.expensesService.getSummary(period);
  }

  @Get('categories')
  async getCategories() {
    return this.expensesService.findAllCategories();
  }
}
