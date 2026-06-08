const prisma = require('../database/connection');

const getDispatches = async (req, res) => {
  try {
    const dispatches = await prisma.dispatch.findMany({
      include: {
        client: true,
        items: {
          include: {
            product: true,
            lot: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener despachos', details: error.message });
  }
};

const createDispatch = async (req, res) => {
  try {
    const { clientId, date, items, createdBy } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Ajustar fecha para mantener la hora actual y evitar desfase de -5 horas (UTC)
      const exactDate = new Date();
      if (date) {
        const [year, month, day] = date.split('-');
        exactDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // 1. Obtener correlativo de Despacho
      const dateStr = exactDate.toISOString().split('T')[0].replace(/-/g, '');
      const todayCount = await tx.dispatch.count({
        where: { dispatchNumber: { startsWith: `D-${dateStr}-` } }
      });
      const dispatchNumber = `D-${dateStr}-${String(todayCount + 1).padStart(2, '0')}`;

      // 2. Crear cabecera de despacho
      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNumber,
          clientId,
          date: exactDate,
          createdBy: createdBy || 'Sistema'
        }
      });

      // 3. Procesar ítems (Salidas)
      for (const item of items) {
        // Verificar stock del lote
        const lotToCheck = await tx.lot.findUnique({ where: { id: item.lotId } });
        if (!lotToCheck || lotToCheck.quantity < parseFloat(item.quantity)) {
          throw new Error(`Stock insuficiente en lote. Solicitado: ${item.quantity}`);
        }

        // Obtener saldo anterior
        const productLots = await tx.lot.findMany({ where: { productId: item.productId, status: 'ACTIVO' } });
        const previousBalance = productLots.reduce((acc, l) => acc + parseFloat(l.quantity), 0);
        const newBalance = previousBalance - parseFloat(item.quantity);

        // Descontar del lote
        await tx.lot.update({
          where: { id: item.lotId },
          data: { quantity: { decrement: parseFloat(item.quantity) } }
        });

        // Crear DispatchItem
        await tx.dispatchItem.create({
          data: {
            dispatchId: dispatch.id,
            productId: item.productId,
            lotId: item.lotId,
            quantity: parseFloat(item.quantity)
          }
        });

        // Registrar en Kardex (Movement)
        const clientObj = await tx.client.findUnique({ where: { id: clientId } });
        await tx.movement.create({
          data: {
            productId: item.productId,
            lotId: item.lotId,
            type: "SALIDA",
            quantity: parseFloat(item.quantity),
            previousBalance,
            newBalance,
            reason: `Despacho a ${clientObj?.razonSocial || 'Cliente'}`,
            reference: dispatchNumber,
            date: exactDate,
            createdBy: createdBy || 'Sistema'
          }
        });
      }

      return dispatch;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating dispatch:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getDispatches,
  createDispatch
};
