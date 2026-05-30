const prisma = require('../database/connection');

const getProductos = async (req, res) => {
  const { warehouseName, status } = req.query;
  const statusFilter = status ? (status === 'TODOS' ? undefined : status) : 'ACTIVO';

  try {
    const productos = await prisma.product.findMany({
      where: {
        warehouse: warehouseName ? { name: warehouseName } : undefined,
        status: statusFilter !== undefined ? statusFilter : undefined
      },
      include: {
        lots: {
          where: { status: 'ACTIVO' }
        }
      }
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const createProducto = async (req, res) => {
  const { warehouseName, description, category, unitPrice, lots, minStock } = req.body;
  
  try {
    const warehouse = await prisma.warehouse.findUnique({ where: { name: warehouseName } });
    if (!warehouse) return res.status(404).json({ error: 'Almacén no encontrado' });

    // Generar SKU
    const catPrefix = category.substring(0, 3).toUpperCase();
    const namePrefix = description.replace(/\s+/g, '').substring(0, 6).toUpperCase();
    const prefix = `${catPrefix}-${namePrefix}`;
    
    const count = await prisma.product.count({
      where: { sku: { startsWith: prefix } }
    });
    const skuNumber = String(count + 1).padStart(3, '0');
    const newSku = `${prefix}-${skuNumber}`;

    const producto = await prisma.product.create({
      data: {
        warehouseId: warehouse.id,
        sku: newSku,
        description,
        category,
        unitPrice: parseFloat(unitPrice) || 0,
        minStock: parseFloat(minStock) || 0,
        lots: lots && lots.length > 0 ? {
          create: lots.map(lot => ({
            lotCode: lot.lotCode,
            quantity: parseFloat(lot.quantity) || 0,
            expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : null
          }))
        } : undefined
      },
      include: {
        lots: true
      }
    });
    res.status(201).json(producto);
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    res.status(500).json({ error: 'Error al crear producto', details: error.message });
  }
};

const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { description, category, unitPrice, lots, status, minStock } = req.body;
  
  try {
    // 1. Actualizar Producto
    const producto = await prisma.product.update({
      where: { id },
      data: {
        description,
        category,
        unitPrice: parseFloat(unitPrice) || 0,
        ...(minStock !== undefined && { minStock: parseFloat(minStock) || 0 }),
        ...(status && { status })
      }
    });

    // 2. Actualizar Lotes existentes o crear Nuevos Lotes
    if (lots && lots.length > 0) {
      for (const lot of lots) {
        if (lot.id) {
          // Actualizar lote existente (NO se actualiza la cantidad)
          await prisma.lot.update({
            where: { id: lot.id },
            data: {
              lotCode: lot.lotCode,
              expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : null
            }
          });
        } else {
          // Crear nuevo lote añadido desde edición
          await prisma.lot.create({
            data: {
              productId: id,
              lotCode: lot.lotCode,
              quantity: parseFloat(lot.quantity) || 0,
              expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : null
            }
          });
        }
      }
    }

    res.json({ message: 'Producto actualizado con éxito' });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    res.status(500).json({ error: 'Error al actualizar producto', details: error.message });
  }
};

const deleteProducto = async (req, res) => {
  const { id } = req.params;
  try {
    // Soft Delete (Pasar a INACTIVO)
    await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVO' }
    });
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    res.status(500).json({ error: 'Error al eliminar producto', details: error.message });
  }
};

module.exports = {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
};
