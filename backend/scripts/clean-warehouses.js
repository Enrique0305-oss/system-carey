const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    for (const w of warehouses) {
      if (w._count.products === 0) {
        console.log(`Eliminando almacén sin uso: ${w.name}`);
        await prisma.warehouse.delete({ where: { id: w.id } });
      } else {
        console.log(`Manteniendo almacén en uso: ${w.name} (${w._count.products} productos)`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
