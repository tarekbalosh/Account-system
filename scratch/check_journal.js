const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.journalEntry.findMany({
    include: {
      lines: {
        include: { account: true }
      }
    }
  });
  console.log(JSON.stringify(entries, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
