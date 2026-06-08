const prisma = require('../database/connection');

const getTraceability = async (req, res) => {
  try {
    const { lotCode } = req.params;

    // 1. Encontrar el Lote principal
    const lot = await prisma.lot.findFirst({
      where: { lotCode },
      include: {
        product: true,
      }
    });

    if (!lot) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    const traceData = {
      targetLot: lot,
      origin: null,
      inputs: [],
      destinations: []
    };

    // 2. BUSCAR ORIGEN
    // a) ¿Fue producido internamente?
    const prodOutput = await prisma.internalProductionOutput.findFirst({
      where: { lotId: lot.id },
      include: {
        internalProduction: {
          include: {
            inputs: {
              include: {
                product: true,
                lot: true
              }
            }
          }
        }
      }
    });

    if (prodOutput) {
      traceData.origin = {
        type: 'PRODUCCION',
        details: prodOutput.internalProduction
      };
      // Por cada insumo usado, intentar buscar si vino de un proveedor
      const inputsConProveedor = [];
      for (const input of prodOutput.internalProduction.inputs) {
        const pOrder = await prisma.purchaseOrderItem.findFirst({
          where: { lotId: input.lotId },
          include: { purchaseOrder: { include: { provider: true } } }
        });
        inputsConProveedor.push({
          ...input,
          providerInfo: pOrder?.purchaseOrder?.provider || null
        });
      }
      traceData.inputs = inputsConProveedor;
    } else {
      // b) ¿Fue comprado a un proveedor?
      const pOrder = await prisma.purchaseOrderItem.findFirst({
        where: { lotId: lot.id },
        include: { purchaseOrder: { include: { provider: true } } }
      });
      if (pOrder) {
        traceData.origin = {
          type: 'COMPRA',
          details: pOrder.purchaseOrder
        };
      } else {
        traceData.origin = { type: 'DESCONOCIDO', details: null };
      }
    }

    // 3. BUSCAR DESTINOS
    // a) ¿Fue vendido a clientes?
    const dispatches = await prisma.dispatchItem.findMany({
      where: { lotId: lot.id },
      include: {
        dispatch: {
          include: { client: true }
        }
      }
    });

    // b) ¿Fue usado en otra producción?
    const consumedIn = await prisma.internalProductionInput.findMany({
      where: { lotId: lot.id },
      include: {
        internalProduction: {
          include: {
            outputs: {
              include: { product: true, lot: true }
            }
          }
        }
      }
    });

    traceData.destinations = {
      dispatches: dispatches.map(d => ({
        quantity: d.quantity,
        date: d.dispatch.date,
        client: d.dispatch.client.razonSocial,
        dispatchNumber: d.dispatch.dispatchNumber
      })),
      productions: consumedIn.map(c => ({
        quantity: c.quantity,
        date: c.internalProduction.date,
        productionNumber: c.internalProduction.productionNumber,
        resultProducts: c.internalProduction.outputs.map(o => o.product.description).join(', ')
      }))
    };

    res.json(traceData);
  } catch (error) {
    console.error("Error en trazabilidad:", error);
    res.status(500).json({ error: 'Error interno del servidor al buscar trazabilidad' });
  }
};

module.exports = {
  getTraceability
};
