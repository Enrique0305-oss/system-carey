const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener el historial oficial de ajustes (desde InventoryAdjustment)
const getAjustes = async (req, res) => {
  try {
    const ajustes = await prisma.inventoryAdjustment.findMany({
      include: {
        product: true,
        lot: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(ajustes);
  } catch (error) {
    console.error("Error obteniendo historial de ajustes:", error);
    res.status(500).json({ error: "Error interno al obtener ajustes" });
  }
};

// Crear un nuevo ajuste
const createAjuste = async (req, res) => {
  try {
    const { productId, lotId, typeDirection, quantity, reason, reference, createdBy } = req.body;
    
    // typeDirection: 'INGRESO' o 'SALIDA'
    const adjustmentQty = parseFloat(quantity);
    if (isNaN(adjustmentQty) || adjustmentQty <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a cero." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Calcular balance actual del producto
      const lots = await tx.lot.findMany({ where: { productId } });
      const previousBalance = lots.reduce((acc, l) => acc + parseFloat(l.quantity), 0);
      
      let newBalance = previousBalance;
      let finalQuantity = adjustmentQty;

      if (typeDirection === 'SALIDA') {
        finalQuantity = -adjustmentQty;
        newBalance = previousBalance - adjustmentQty;
        
        // Validar que el lote tenga stock suficiente
        const currentLot = await tx.lot.findUnique({ where: { id: lotId } });
        if (!currentLot || parseFloat(currentLot.quantity) < adjustmentQty) {
          throw new Error("El lote seleccionado no tiene stock suficiente para esta salida.");
        }
      } else {
        newBalance = previousBalance + adjustmentQty;
      }

      // 1. Actualizar cantidad en el Lote
      await tx.lot.update({
        where: { id: lotId },
        data: { quantity: { increment: finalQuantity } }
      });

      // Generar correlativo AJ-XXXXX
      const count = await tx.inventoryAdjustment.count();
      const newAdjustmentNumber = `AJ-${String(count + 1).padStart(5, '0')}`;

      // 2. Crear documento de Ajuste Oficial (InventoryAdjustment)
      const newAdjustment = await tx.inventoryAdjustment.create({
        data: {
          adjustmentNumber: newAdjustmentNumber,
          productId,
          lotId,
          typeDirection,
          quantity: adjustmentQty, // se guarda en positivo
          reason,
          reference: reference || null,
          createdBy: createdBy || "Sistema"
        },
        include: { product: true, lot: true }
      });

      // 3. Crear Movimiento en el Kardex General (ENTRADA o SALIDA)
      await tx.movement.create({
        data: {
          productId,
          lotId,
          type: typeDirection === 'INGRESO' ? 'ENTRADA' : 'SALIDA',
          quantity: adjustmentQty, // siempre positivo
          previousBalance,
          newBalance,
          reason: reason === "Consumo Interno" ? "Consumo Interno" : `Ajuste de Inventario - ${reason}`,
          reference: newAdjustmentNumber,
          createdBy: createdBy || "Sistema"
        }
      });

      return newAdjustment;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creando ajuste:", error);
    res.status(500).json({ error: error.message || "Error al registrar el ajuste" });
  }
};

module.exports = {
  getAjustes,
  createAjuste
};
