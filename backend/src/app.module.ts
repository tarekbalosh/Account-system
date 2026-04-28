// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PurchasesModule } from './purchases/purchases.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SalesModule } from './sales/sales.module';
import { AccountingModule } from './accounting/accounting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    SalesModule,
    ExpensesModule,
    PurchasesModule,
    InventoryModule,
    NotificationsModule,
    AccountingModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
