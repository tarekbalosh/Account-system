
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing findAll query...');
    const result = await prisma.sale.findMany({
      include: {
        items: {
          include: { inventory: true }
        }
      }
    });
    console.log('findAll success, count:', result.length);

    console.log('Testing getSummary query...');
    const sales = await prisma.sale.findMany({
      orderBy: { date: 'asc' },
    });
    console.log('getSummary found sales:', sales.length);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
