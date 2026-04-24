// src/inventory/inventory.controller.ts
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
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateInventoryDto, @User('userId') userId: number) {
    return this.inventoryService.create(dto, userId);
  }

  @Get()
  @Roles('ADMIN', 'ACCOUNTANT')
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryDto, @User('userId') userId: number) {
    return this.inventoryService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.delete(id);
  }

  @Post(':id/withdraw')
  @Roles('ADMIN', 'ACCOUNTANT')
  async withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number,
    @User('userId') userId: number
  ) {
    return this.inventoryService.withdraw(id, quantity, userId);
  }
}
