// src/lib/types.ts

export type Role = 'ADMIN' | 'ACCOUNTANT';

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RevenueCategory {
  id: number;
  name: string;
}

export interface RevenueItem {
  id: number;
  revenueId: number;
  inventoryId: number;
  inventory?: InventoryItem;
  quantity: number;
}

export interface Revenue {
  id: number;
  amount: number;
  date: string;
  description?: string;
  categoryId: number;
  category?: RevenueCategory;
  items?: RevenueItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  inventoryId: number;
  inventory?: InventoryItem;
  quantity: number;
}

export interface Sale {
  id: number;
  amount: number;
  date: string;
  description?: string;
  items?: SaleItem[];
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  date: string;
  description?: string;
  categoryId: number;
  category?: ExpenseCategory;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseItem {
  id: number;
  materialId: number;
  material?: InventoryItem;
  quantity: number;
  unitCost: number;
}

export interface Purchase {
  id: number;
  supplier: string;
  invoiceDate: string;
  totalAmount: number;
  items?: PurchaseItem[];
}

export interface ProfitLossReport {
  period: { from: string; to: string };
  totalRevenue: number;
  generalExpenses: number;
  consumptionMaterials: number;
  totalExpenses: number;
  netProfit: number;
}

export interface Notification {
  type: 'WARNING' | 'CRITICAL';
  message: string;
}
