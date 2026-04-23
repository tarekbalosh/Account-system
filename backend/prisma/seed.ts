// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@accounting.com' },
    update: {},
    create: {
      email: 'admin@accounting.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Accountant User
  const accountantPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@accounting.com' },
    update: {},
    create: {
      email: 'staff@accounting.com',
      password: accountantPassword,
      role: 'ACCOUNTANT',
    },
  });

  // Revenue Categories
  const revenueCategories = ['Food Sales', 'Beverage Sales', 'Catering', 'Events', 'Takeout'];
  for (const name of revenueCategories) {
    await prisma.revenueCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Expense Categories
  const expenseCategories = ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Marketing', 'Insurance'];
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Inventory Items
  const materials = [
    { name: 'Potatoes (20kg)', quantity: 10, unitCost: 15.00 },
    { name: 'Cooking Oil (10L)', quantity: 5, unitCost: 25.00 },
    { name: 'Chicken Breast (kg)', quantity: 20, unitCost: 8.50 },
    { name: 'Flour (50kg)', quantity: 8, unitCost: 35.00 },
    { name: 'Coffee Beans (kg)', quantity: 12, unitCost: 22.00 },
  ];
  for (const item of materials) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item },
    });
  }

  console.log('✅ Seed successful: Admin/Accountant users, Categories, and Materials created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
