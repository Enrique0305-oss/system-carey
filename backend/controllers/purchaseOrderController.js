const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getOrders = async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        provider: true,
        user: true,
        items: {
          include: { product: true, lot: true }
        }
      },
      orderBy: { issueDate: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { providerId, issueDate, expectedDate, includeIgv, subtotal, tax, total, notes, userId, items, quoteNumber, invoiceNumber, shippingCost } = req.body;
    
    // Generar un correlativo OC-0000X
    const lastOrder = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    let nextNum = 1;
    if (lastOrder && lastOrder.orderNumber.startsWith('OC-')) {
      const numPart = lastOrder.orderNumber.split('-')[1];
      nextNum = parseInt(numPart, 10) + 1;
    }
    const orderNumber = `OC-${String(nextNum).padStart(5, '0')}`;

    let finalUserId = userId;
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) throw new Error("No hay usuarios en la base de datos.");
      finalUserId = firstUser.id;
    }

    // Procesar los lotes primero
    const itemsToCreate = [];
    for (const item of items) {
      let finalLotId = item.lotId || null;
      
      if (item.isNewLot && item.lotCode) {
        const newLot = await prisma.lot.create({
          data: {
            productId: item.productId,
            lotCode: item.lotCode,
            quantity: 0, // Se ingresará cantidad real cuando la orden cambie a COMPLETADA o se reciba
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
          }
        });
        finalLotId = newLot.id;
      }
      
      itemsToCreate.push({
        productId: item.productId,
        lotId: finalLotId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      });
    }

    const newOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        providerId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        quoteNumber,
        invoiceNumber,
        includeIgv,
        subtotal,
        tax,
        shippingCost: shippingCost ? parseFloat(shippingCost) : 0,
        total,
        notes,
        userId: finalUserId,
        items: {
          create: itemsToCreate
        }
      },
      include: {
        provider: true,
        items: true
      }
    });

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, receivedBy } = req.body;
    
    // Obtener la orden actual
    const currentOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, user: true }
    });

    if (!currentOrder) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // Si ya está recibida y se intenta cambiar, no permitir (para evitar doble ingreso)
    if (currentOrder.status === 'RECIBIDA' && status !== 'RECIBIDA') {
      return res.status(400).json({ error: "No se puede cambiar el estado de una orden ya recibida." });
    }

    if (status === 'RECIBIDA' && currentOrder.status !== 'RECIBIDA') {
      // Usar transacción para asegurar la integridad
      const result = await prisma.$transaction(async (tx) => {
        // 1. Actualizar estado de la OC y receivedBy
        const updatedOC = await tx.purchaseOrder.update({
          where: { id },
          data: { 
            status,
            receivedBy: receivedBy || "Sistema"
          }
        });

        // 2. Por cada item, actualizar Lote y crear Movimiento
        for (const item of currentOrder.items) {
          // Calcular balance actual del producto sumando todos sus lotes antes del cambio
          const lots = await tx.lot.findMany({ where: { productId: item.productId } });
          const previousBalance = lots.reduce((acc, lot) => acc + parseFloat(lot.quantity), 0);
          const newBalance = previousBalance + parseFloat(item.quantity);

          if (item.lotId) {
            // Actualizar cantidad en el Lote
            await tx.lot.update({
              where: { id: item.lotId },
              data: { quantity: { increment: item.quantity } }
            });
          }

          // Crear Movimiento de Entrada
          await tx.movement.create({
            data: {
              productId: item.productId,
              lotId: item.lotId,
              type: 'ENTRADA',
              quantity: item.quantity,
              previousBalance,
              newBalance,
              reason: 'Compra Proveedor',
              reference: currentOrder.orderNumber,
              createdBy: receivedBy || currentOrder.user?.name || "Sistema" 
            }
          });
        }
        return updatedOC;
      });

      return res.json(result);
    } else {
      // Cambios simples de estado (ej: a EN_REVISION, PENDIENTE, CANCELADA)
      const updateData = { status };
      if (status === 'PENDIENTE') {
        updateData.approvedBy = req.body.approvedBy || "Gerente General"; // Simulación
      }
      
      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: updateData
      });
      return res.json(updated);
    }
    
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(400).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalOrders = await prisma.purchaseOrder.count();
    const pendingOrders = await prisma.purchaseOrder.count({ where: { status: 'PENDIENTE' } });
    
    const totalSpentAggregation = await prisma.purchaseOrder.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELADA' } } // No sumar canceladas
    });
    
    res.json({
      totalOrders,
      pendingOrders,
      totalSpent: totalSpentAggregation._sum.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  getStats
};
