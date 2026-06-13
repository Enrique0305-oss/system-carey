const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const warehouses = [
  { name: 'Materia Prima' },
  { name: 'Insumos y Aditivos' },
  { name: 'Suministros y Envases' },
  { name: 'Químicos y Limpieza' },
  { name: 'Productos Terminados' }
];

const productsData = [
  // Materia Prima
  { description: 'Carne de Cerdo (Pierna)', category: 'Cárnicos', unit: 'KG', unitPrice: 15.50, minStock: 50, warehouse: 'Materia Prima' },
  { description: 'Carne de Cerdo (Paleta)', category: 'Cárnicos', unit: 'KG', unitPrice: 14.00, minStock: 50, warehouse: 'Materia Prima' },
  { description: 'Grasa de Cerdo (Papada / Tocino)', category: 'Cárnicos', unit: 'KG', unitPrice: 8.50, minStock: 30, warehouse: 'Materia Prima' },
  { description: 'Carne de Res (Corte Industrial)', category: 'Cárnicos', unit: 'KG', unitPrice: 18.00, minStock: 40, warehouse: 'Materia Prima' },
  { description: 'Carne de Pollo (MDM)', category: 'Cárnicos', unit: 'KG', unitPrice: 6.50, minStock: 100, warehouse: 'Materia Prima' },
  
  // Insumos y Aditivos
  { description: 'Sal Cura (Nitrito de Sodio)', category: 'Aditivos', unit: 'KG', unitPrice: 12.00, minStock: 5, warehouse: 'Insumos y Aditivos' },
  { description: 'Tripa Natural de Cerdo (Calibre 28-30)', category: 'Fundas', unit: 'Madeja', unitPrice: 45.00, minStock: 10, warehouse: 'Insumos y Aditivos' },
  { description: 'Tripa de Celulosa (Salchichas)', category: 'Fundas', unit: 'Rollo', unitPrice: 120.00, minStock: 2, warehouse: 'Insumos y Aditivos' },
  { description: 'Tripa de Colágeno (Chorizos)', category: 'Fundas', unit: 'Rollo', unitPrice: 95.00, minStock: 3, warehouse: 'Insumos y Aditivos' },
  { description: 'Pimienta Negra Molida', category: 'Especias', unit: 'KG', unitPrice: 35.00, minStock: 5, warehouse: 'Insumos y Aditivos' },
  { description: 'Ajo en Polvo', category: 'Especias', unit: 'KG', unitPrice: 28.00, minStock: 5, warehouse: 'Insumos y Aditivos' },
  { description: 'Humo Líquido', category: 'Aditivos', unit: 'Litros', unitPrice: 55.00, minStock: 2, warehouse: 'Insumos y Aditivos' },
  { description: 'Fosfato de Sodio', category: 'Aditivos', unit: 'KG', unitPrice: 18.00, minStock: 10, warehouse: 'Insumos y Aditivos' },
  
  // Suministros y Envases
  { description: 'Bolsas Empaque al Vacío (20x30 cm)', category: 'Empaques', unit: 'Millar', unitPrice: 150.00, minStock: 1, warehouse: 'Suministros y Envases' },
  { description: 'Film Extensible', category: 'Empaques', unit: 'Rollo', unitPrice: 45.00, minStock: 5, warehouse: 'Suministros y Envases' },
  { description: 'Cajas de Cartón (10 KG)', category: 'Empaques', unit: 'Unidad', unitPrice: 2.50, minStock: 100, warehouse: 'Suministros y Envases' },
  { description: 'Etiquetas Chorizo Parrillero', category: 'Etiquetas', unit: 'Millar', unitPrice: 35.00, minStock: 2, warehouse: 'Suministros y Envases' },
  
  // Químicos y Limpieza
  { description: 'Lejía (Hipoclorito de Sodio al 5%)', category: 'Limpieza', unit: 'Litros', unitPrice: 2.50, minStock: 20, warehouse: 'Químicos y Limpieza' },
  { description: 'Detergente Industrial Alcalino', category: 'Limpieza', unit: 'Galones', unitPrice: 45.00, minStock: 5, warehouse: 'Químicos y Limpieza' },
  { description: 'Alcohol Isopropílico al 70%', category: 'Desinfección', unit: 'Litros', unitPrice: 12.00, minStock: 10, warehouse: 'Químicos y Limpieza' },
  { description: 'Bolsas de Basura (Industrial)', category: 'Limpieza', unit: 'Ciento', unitPrice: 25.00, minStock: 3, warehouse: 'Químicos y Limpieza' },
  { description: 'Guantes de Nitrilo Azules', category: 'EPP', unit: 'Caja', unitPrice: 35.00, minStock: 10, warehouse: 'Químicos y Limpieza' },
  
  // Productos Terminados
  { description: 'Chorizo Parrillero Pre-cocido (500g)', category: 'Embutidos Crudos', unit: 'Paquete', unitPrice: 12.50, minStock: 50, warehouse: 'Productos Terminados' },
  { description: 'Salchicha Huachana (500g)', category: 'Embutidos Crudos', unit: 'Paquete', unitPrice: 14.00, minStock: 30, warehouse: 'Productos Terminados' },
  { description: 'Salchicha de Viena (1 KG)', category: 'Embutidos Cocidos', unit: 'Paquete', unitPrice: 18.50, minStock: 40, warehouse: 'Productos Terminados' },
  { description: 'Jamón Inglés Especial (3 KG)', category: 'Jamones', unit: 'Molde', unitPrice: 85.00, minStock: 10, warehouse: 'Productos Terminados' },
  { description: 'Tocino Ahumado Tajado (250g)', category: 'Ahumados', unit: 'Paquete', unitPrice: 9.50, minStock: 30, warehouse: 'Productos Terminados' }
];

async function seed() {
  try {
    console.log('Iniciando carga de almacenes y productos...');

    // 1. Crear o encontrar los almacenes
    const warehouseMap = {};
    for (const w of warehouses) {
      let warehouse = await prisma.warehouse.findUnique({ where: { name: w.name } });
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({ data: { name: w.name } });
        console.log(`Almacén creado: ${w.name}`);
      } else {
        console.log(`Almacén ya existía: ${w.name}`);
      }
      warehouseMap[w.name] = warehouse.id;
    }

    // 2. Insertar productos
    let count = 0;
    for (const p of productsData) {
      const warehouseId = warehouseMap[p.warehouse];
      
      // Buscar si ya existe por descripcion y almacen
      const existingProduct = await prisma.product.findFirst({
        where: { description: p.description, warehouseId }
      });

      if (!existingProduct) {
        // Generar un SKU básico
        const skuPrefix = p.category.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const sku = `${skuPrefix}-${randomNum}`;

        await prisma.product.create({
          data: {
            sku,
            description: p.description,
            category: p.category,
            unit: p.unit,
            unitPrice: p.unitPrice,
            minStock: p.minStock,
            warehouseId,
            status: 'ACTIVO'
          }
        });
        count++;
      }
    }

    console.log(`¡Carga completada! Se insertaron ${count} nuevos productos.`);
  } catch (error) {
    console.error('Error durante la carga:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
