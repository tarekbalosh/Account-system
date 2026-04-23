
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const salesCount = await prisma.sale.count();
    console.log('Sales count:', salesCount);
    const sales = await prisma.sale.findMany({ take: 5 });
    console.log('Sample sales:', JSON.stringify(sales, null, 2));
  } catch (error) {
    console.error('Error querying sales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
