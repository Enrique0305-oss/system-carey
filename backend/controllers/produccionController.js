const prisma = require('../database/connection');

const getProducciones = async (req, res) => {
  try {
    const producciones = await prisma.internalProduction.findMany({
      orderBy: { date: 'desc' },
      include: {
        inputs: {
          include: {
            product: true,
            lot: true
          }
        },
        outputs: {
          include: {
            product: true,
            lot: true
          }
        }
      }
    });
    res.json(producciones);
  } catch (error) {
    console.error("Error al obtener producciones:", error);
    res.status(500).json({ error: 'Error al obtener producciones' });
  }
};

const createProduccion = async (req, res) => {
  const { date, createdBy, inputs, outputs } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Generar ID de producción PR-0000X
      const count = await tx.internalProduction.count();
      const productionNumber = `PR-${String(count + 1).padStart(5, '0')}`;

      // Crear registro principal
      const produccion = await tx.internalProduction.create({
        data: {
          productionNumber,
          date: date ? new Date(date) : new Date(),
          createdBy,
          status: "COMPLETADO"
        }
      });

      // Procesar INPUTS (Salidas de almacén)
      for (const input of inputs) {
        // Reducir stock del lote
        const lot = await tx.lot.update({
          where: { id: input.lotId },
          data: {
            quantity: { decrement: parseFloat(input.quantity) }
          }
        });

        // Crear registro en InternalProductionInput
        await tx.internalProductionInput.create({
          data: {
            internalProductionId: produccion.id,
            productId: input.productId,
            lotId: input.lotId,
            quantity: parseFloat(input.quantity)
          }
        });

        // Crear Movimiento de Salida en Kardex
        await tx.movement.create({
          data: {
            productId: input.productId,
            lotId: input.lotId,
            type: "SALIDA",
            quantity: parseFloat(input.quantity),
            reason: `Consumo en Producción ${productionNumber}`,
            reference: productionNumber,
            date: produccion.date,
            createdBy: createdBy
          }
        });
      }

      // Procesar OUTPUTS (Entradas de almacén)
      const dateStr = produccion.date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      let outputIndex = 1;

      for (const output of outputs) {
        // Generar lote automático para la salida
        const autoLotCode = `L-${dateStr}-${String(outputIndex).padStart(2, '0')}`;
        outputIndex++;

        // Crear el nuevo lote para el producto resultante
        const newLot = await tx.lot.create({
          data: {
            productId: output.productId,
            lotCode: autoLotCode,
            quantity: parseFloat(output.quantity),
            entryDate: produccion.date,
            expirationDate: output.expirationDate ? new Date(output.expirationDate) : null,
            createdBy: createdBy
          }
        });

        // Crear registro en InternalProductionOutput
        await tx.internalProductionOutput.create({
          data: {
            internalProductionId: produccion.id,
            productId: output.productId,
            lotId: newLot.id,
            quantity: parseFloat(output.quantity)
          }
        });

        // Crear Movimiento de Entrada en Kardex
        await tx.movement.create({
          data: {
            productId: output.productId,
            lotId: newLot.id,
            type: "ENTRADA",
            quantity: parseFloat(output.quantity),
            reason: `Ingreso por Producción ${productionNumber}`,
            reference: productionNumber,
            date: produccion.date,
            createdBy: createdBy
          }
        });
      }

      return produccion;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("❌ Error al crear producción interna:", error);
    res.status(500).json({ error: 'Error al registrar producción', details: error.message });
  }
};

module.exports = {
  getProducciones,
  createProduccion
};
