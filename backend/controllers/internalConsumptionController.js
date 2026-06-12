const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los consumos internos
exports.getAllConsumptions = async (req, res) => {
  try {
    const consumptions = await prisma.internalConsumption.findMany({
      include: {
        items: {
          include: {
            product: true,
            lot: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(consumptions);
  } catch (error) {
    console.error('Error fetching internal consumptions:', error);
    res.status(500).json({ error: 'Error al obtener consumos internos' });
  }
};

// Crear un consumo interno (carrito de items)
exports.createConsumption = async (req, res) => {
  const { date, reason, createdBy, items } = req.body;
  
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Debe enviar al menos un item para consumir.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generar número de consumo
      const count = await tx.internalConsumption.count();
      const consumptionNumber = `CI-${String(count + 1).padStart(5, '0')}`;

      // 2. Crear cabecera
      const consumption = await tx.internalConsumption.create({
        data: {
          consumptionNumber,
          date: date ? new Date(date) : new Date(),
          reason,
          createdBy: createdBy || 'Sistema',
          items: {
            create: items.map(item => ({
              productId: item.productId,
              lotId: item.lotId,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      });

      // 3. Procesar cada item (descontar stock y generar Kardex)
      for (const item of items) {
        // Obtener el lote actual para balance
        const currentLot = await tx.lot.findUnique({ where: { id: item.lotId } });
        if (!currentLot) throw new Error(`Lote no encontrado: ${item.lotId}`);

        if (Number(currentLot.quantity) < Number(item.quantity)) {
          throw new Error(`Stock insuficiente en el lote para el producto ID: ${item.productId}`);
        }

        // Descontar del lote
        const updatedLot = await tx.lot.update({
          where: { id: item.lotId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });

        // Registrar en Kardex (Movement)
        await tx.movement.create({
          data: {
            productId: item.productId,
            lotId: item.lotId,
            type: 'SALIDA',
            quantity: item.quantity,
            previousBalance: currentLot.quantity,
            newBalance: updatedLot.quantity,
            reason: 'Consumo Interno',
            reference: consumptionNumber,
            createdBy: createdBy || 'Sistema',
            date: date ? new Date(date) : new Date()
          }
        });
      }

      return consumption;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating internal consumption:', error);
    res.status(400).json({ error: error.message || 'Error al registrar el consumo interno' });
  }
};
