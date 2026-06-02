const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  try {
    await prisma.warehouse.updateMany({
      where: { name: "Envases" },
      data: { name: "Almacén de Envases y Suministros" }
    });
    
    await prisma.warehouse.updateMany({
      where: { name: "Químicos" },
      data: { name: "Almacén Químicos y Suministro" }
    });
    
    console.log("Updated warehouse names successfully");
  } catch (error) {
    console.error("Error updating warehouse names:", error);
  } finally {
    await prisma.$disconnect();
  }
}

update();
