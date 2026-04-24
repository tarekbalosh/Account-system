// src/purchases/purchases.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  async create(@Body() dto: CreatePurchaseDto, @User('userId') userId: number) {
    return this.purchasesService.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'ACCOUNTANT')
  async findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.remove(id);
  }
}
