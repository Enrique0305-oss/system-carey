const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Crear Áreas
  const areas = [
    { name: 'Gerencia' },
    { name: 'Almacen' },
    { name: 'Despacho' }
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { name: area.name },
      update: {},
      create: area,
    });
  }
  console.log(' Áreas creadas');

  const gerenciaArea = await prisma.area.findUnique({ where: { name: 'Gerencia' } });
  const almacenArea = await prisma.area.findUnique({ where: { name: 'Almacen' } });
  const despachoArea = await prisma.area.findUnique({ where: { name: 'Despacho' } });

  // Crear Usuarios por defecto
  const passwordHash = await bcrypt.hash('123456', 10);

  const defaultUsers = [
    {
      email: 'admin@carey.com',
      name: 'Gerente General',
      password: passwordHash,
      areaId: gerenciaArea.id
    },
    {
      email: 'almacen@carey.com',
      name: 'Jefe de Almacén',
      password: passwordHash,
      areaId: almacenArea.id
    },
    {
      email: 'despacho@carey.com',
      name: 'Jefe de Despacho',
      password: passwordHash,
      areaId: despachoArea.id
    }
  ];

  for (const user of defaultUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log(' Usuarios creados exitosamente (Contraseña por defecto: 123456)');
  console.log('- admin@carey.com');
  console.log('- almacen@carey.com');
  console.log('- despacho@carey.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
