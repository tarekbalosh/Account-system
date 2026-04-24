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
import { RevenuesService } from './revenues.service';
import { CreateRevenueDto } from './dto/create-revenue.dto';
import { UpdateRevenueDto } from './dto/update-revenue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACCOUNTANT')
@Controller('revenues')
export class RevenuesController {
  constructor(private readonly revenuesService: RevenuesService) {}

  @Post()
  async create(@Body() dto: CreateRevenueDto, @User('userId') userId: number) {
    return this.revenuesService.create(dto, userId);
  }

  @Get()
  async findAll(@Query('from') from?: string, @Query('to') to?: string, @Query('categoryId') categoryId?: string) {
    return this.revenuesService.findAll({ from, to, categoryId: categoryId ? Number(categoryId) : undefined });
  }

  @Get('summary')
  async getSummary(@Query('period') period: 'daily' | 'monthly' = 'daily') {
    return this.revenuesService.getSummary(period);
  }

  @Get('categories')
  async getCategories() {
    return this.revenuesService.findAllCategories();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRevenueDto, @User('userId') userId: number) {
    return this.revenuesService.update(Number(id), dto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.revenuesService.delete(Number(id));
  }
}
