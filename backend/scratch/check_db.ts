import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const latestRev = await prisma.revenue.findFirst({ orderBy: { date: 'desc' } });
  console.log('Latest Revenue Date:', latestRev?.date);
  const count = await prisma.revenue.count();
  console.log('Revenue Count:', count);
}
run();
