const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSkus() {
  const products = await prisma.product.findMany();
  for (const product of products) {
    if (!product.sku) {
      const catPrefix = product.category.substring(0, 3).toUpperCase();
      const namePrefix = product.description.replace(/\s+/g, '').substring(0, 6).toUpperCase();
      const prefix = `${catPrefix}-${namePrefix}`;
      
      const count = await prisma.product.count({
        where: { sku: { startsWith: prefix } }
      });
      
      const skuNumber = String(count + 1).padStart(3, '0');
      const newSku = `${prefix}-${skuNumber}`;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { sku: newSku }
      });
      console.log(`Updated product ${product.description} with SKU: ${newSku}`);
    }
  }
  console.log('All products updated.');
}

updateSkus()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
