// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // 1. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@accounting.com' },
    update: {},
    create: {
      email: 'admin@accounting.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@accounting.com' },
    update: {},
    create: {
      email: 'staff@accounting.com',
      password: staffPassword,
      role: 'ACCOUNTANT',
    },
  });

  // 2. Categories
  const revCats = await Promise.all(
    ['Food Sales', 'Beverage Sales', 'Catering', 'Events'].map(name =>
      prisma.revenueCategory.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const expCats = await Promise.all(
    ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Maintenance'].map(name =>
      prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // 3. Inventory Items
  const items = [
    { name: 'Potatoes (20kg)', quantity: 10, unitCost: 15.00 },
    { name: 'Cooking Oil (10L)', quantity: 5, unitCost: 25.00 },
    { name: 'Chicken Breast (kg)', quantity: 20, unitCost: 8.50 },
    { name: 'Flour (50kg)', quantity: 8, unitCost: 35.00 },
  ];
  for (const item of items) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: { ...item, user: { connect: { id: admin.id } } },
    });
  }

  // 4. Generate Revenues (Daily for the last 30 days)
  console.log('💰 Generating Revenues...');
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    await prisma.revenue.create({
      data: {
        amount: 800 + Math.random() * 500,
        date,
        description: i % 7 === 0 ? 'Weekend Event' : 'Daily Lunch/Dinner Rush',
        category: { connect: { id: revCats[i % revCats.length].id } },
        user: { connect: { id: i % 2 === 0 ? admin.id : staff.id } }
      }
    });
  }

  // 5. Generate Expenses
  console.log('💸 Generating Expenses...');
  const expenses = [
    { amount: 3500.00, desc: 'Monthly Restaurant Rent', cat: 'Rent' },
    { amount: 12000.00, desc: 'Staff Payroll - April', cat: 'Salaries' },
    { amount: 450.00, desc: 'Electricity & Water Bill', cat: 'Utilities' },
    { amount: 800.00, desc: 'Bulk Meat Supply Purchase', cat: 'Supplies' },
    { amount: 250.00, desc: 'Social Media Marketing', cat: 'Maintenance' },
  ];

  for (const exp of expenses) {
    const category = expCats.find(c => c.name === exp.cat);
    if (!category) continue;
    
    await prisma.expense.create({
      data: {
        amount: exp.amount,
        date: new Date(now.getFullYear(), now.getMonth(), 5 + Math.random() * 20),
        description: exp.desc,
        category: { connect: { id: category.id } },
        user: { connect: { id: admin.id } }
      }
    });
  }

  console.log('✅ Seed complete: 30 Revenues, 5 Expenses, 4 Inventory items created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
