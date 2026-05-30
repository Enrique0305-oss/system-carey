const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const res = await prisma.movement.updateMany({
      where: { createdBy: user.id },
      data: { createdBy: user.name }
    });
    console.log(`Updated ${res.count} records for user: ${user.name}`);
  }
  console.log("Fix completado.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
