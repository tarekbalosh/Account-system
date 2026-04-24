import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.salesService.create(createSaleDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get('summary')
  getSummary(@Query('period') period: 'daily' | 'monthly' = 'daily') {
    return this.salesService.getSummary(period);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto, @Request() req) {
    return this.salesService.update(+id, updateSaleDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.delete(+id);
  }
}
