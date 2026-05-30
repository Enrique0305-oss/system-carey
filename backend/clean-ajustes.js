const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    await prisma.inventoryAdjustment.deleteMany({});
    await prisma.movement.deleteMany({
      where: { reason: { contains: 'Ajuste de Inventario' } }
    });
    console.log("Deleted test records");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
clean();
