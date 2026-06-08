const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAlmacenAlerts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVO'
      },
      include: {
        lots: {
          where: { status: 'ACTIVO' }
        },
        warehouse: true
      }
    });

    let lowStockCount = 0;
    const lowStockProducts = [];

    products.forEach(prod => {
      const minStock = parseFloat(prod.minStock) || 0;
      if (minStock > 0) {
        const totalStock = prod.lots.reduce((sum, lot) => sum + parseFloat(lot.quantity || 0), 0);
        if (totalStock <= minStock) {
          lowStockCount++;
          lowStockProducts.push({
            id: prod.id,
            description: prod.description,
            category: prod.category,
            totalStock,
            minStock,
            status: totalStock < minStock ? 'CRITICO' : 'PRECAUCION',
            warehouseName: prod.warehouse?.name || 'Otros'
          });
        }
      }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 1. Merma Mensual
    const mermas = await prisma.inventoryAdjustment.findMany({
      where: {
        date: { gte: currentMonthStart },
        typeDirection: 'SALIDA',
        reason: { contains: 'Merma' }
      }
    });
    const mermaMes = mermas.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);

    // 2. Top Insumos Utilizados (30 días)
    const productionInputs = await prisma.internalProductionInput.findMany({
      where: { internalProduction: { date: { gte: thirtyDaysAgo } } },
      include: { product: true }
    });
    const inputMap = {};
    productionInputs.forEach(item => {
      if (!item.product) return;
      const pName = item.product.description;
      inputMap[pName] = (inputMap[pName] || 0) + parseFloat(item.quantity || 0);
    });
    const topInsumos = Object.keys(inputMap)
      .map(name => ({ name, quantity: inputMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Ingresos de la Semana (Últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPurchases = await prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          issueDate: { gte: sevenDaysAgo },
          status: { in: ['RECIBIDA', 'PENDIENTE'] } // PENDIENTE o RECIBIDA cuenta como ingresos/compras
        }
      },
      include: { purchaseOrder: true }
    });
    const ingresosMap = {};
    recentPurchases.forEach(item => {
      const dStr = item.purchaseOrder.issueDate.toISOString().split('T')[0];
      ingresosMap[dStr] = (ingresosMap[dStr] || 0) + parseFloat(item.quantity || 0);
    });
    const ingresosSemana = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      ingresosSemana.push({ time: dStr, value: ingresosMap[dStr] || 0 });
    }

    res.json({
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      mermaMes,
      topInsumos,
      ingresosSemana
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching dashboard alerts" });
  }
};

// ---- Dashboard Gerencia ----
const getGerenciaStats = async (req, res) => {
  try {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // 1. Total Invertido (S/.) - Current vs Last Month
    const purchasesCurrent = await prisma.purchaseOrder.findMany({
      where: { issueDate: { gte: currentMonthStart }, status: { in: ['PENDIENTE', 'RECIBIDA'] } },
      select: { total: true }
    });
    const purchasesLast = await prisma.purchaseOrder.findMany({
      where: { issueDate: { gte: lastMonthStart, lt: currentMonthStart }, status: { in: ['PENDIENTE', 'RECIBIDA'] } },
      select: { total: true }
    });
    const totalInvertidoCurrent = purchasesCurrent.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
    const totalInvertidoLast = purchasesLast.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);

    // 2. Volumen Producción - Current vs Last Month
    const prodCurrent = await prisma.internalProductionOutput.findMany({
      where: { internalProduction: { date: { gte: currentMonthStart } } },
      select: { quantity: true }
    });
    const prodLast = await prisma.internalProductionOutput.findMany({
      where: { internalProduction: { date: { gte: lastMonthStart, lt: currentMonthStart } } },
      select: { quantity: true }
    });
    const totalProducidoCurrent = prodCurrent.reduce((acc, p) => acc + parseFloat(p.quantity || 0), 0);
    const totalProducidoLast = prodLast.reduce((acc, p) => acc + parseFloat(p.quantity || 0), 0);

    // 3. Volumen Despachado - Current vs Last Month
    const dispCurrent = await prisma.dispatchItem.findMany({
      where: { dispatch: { date: { gte: currentMonthStart } } },
      select: { quantity: true }
    });
    const dispLast = await prisma.dispatchItem.findMany({
      where: { dispatch: { date: { gte: lastMonthStart, lt: currentMonthStart } } },
      select: { quantity: true }
    });
    const totalDespachadoCurrent = dispCurrent.reduce((acc, d) => acc + parseFloat(d.quantity || 0), 0);
    const totalDespachadoLast = dispLast.reduce((acc, d) => acc + parseFloat(d.quantity || 0), 0);

    // 4. Top 5 Clientes (Histórico o Mes actual)
    // Para no complicar con GroupBy que a veces falla con relaciones en prisma, lo hacemos en memoria para este scale.
    const allDispatches = await prisma.dispatchItem.findMany({
      include: { dispatch: { include: { client: true } } }
    });
    const clientMap = {};
    allDispatches.forEach(item => {
      const clientName = item.dispatch.client.razonSocial;
      clientMap[clientName] = (clientMap[clientName] || 0) + parseFloat(item.quantity);
    });
    const topClients = Object.keys(clientMap)
      .map(name => ({ name, quantity: clientMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 5. Top 5 Productos Estrella
    const productMap = {};
    const allDispatchesWithProduct = await prisma.dispatchItem.findMany({
      include: { product: true }
    });
    allDispatchesWithProduct.forEach(item => {
      const prodName = item.product.description;
      productMap[prodName] = (productMap[prodName] || 0) + parseFloat(item.quantity);
    });
    const topProducts = Object.keys(productMap)
      .map(name => ({ name, quantity: productMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. TimeSeries (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Agrupar Despachos por fecha
    const recentDispatches = await prisma.dispatchItem.findMany({
      where: { dispatch: { date: { gte: thirtyDaysAgo } } },
      include: { dispatch: true }
    });
    // Agrupar Producción por fecha
    const recentProductions = await prisma.internalProductionOutput.findMany({
      where: { internalProduction: { date: { gte: thirtyDaysAgo } } },
      include: { internalProduction: true }
    });

    const timeSeriesMap = {};
    recentDispatches.forEach(item => {
      const dStr = item.dispatch.date.toISOString().split('T')[0];
      if (!timeSeriesMap[dStr]) timeSeriesMap[dStr] = { time: dStr, despachos: 0, produccion: 0 };
      timeSeriesMap[dStr].despachos += parseFloat(item.quantity);
    });
    recentProductions.forEach(item => {
      const dStr = item.internalProduction.date.toISOString().split('T')[0];
      if (!timeSeriesMap[dStr]) timeSeriesMap[dStr] = { time: dStr, despachos: 0, produccion: 0 };
      timeSeriesMap[dStr].produccion += parseFloat(item.quantity);
    });

    // Rellenar días vacíos para Lightweight charts
    const timeSeries = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      timeSeries.push({
        time: dStr,
        despachos: timeSeriesMap[dStr] ? timeSeriesMap[dStr].despachos : 0,
        produccion: timeSeriesMap[dStr] ? timeSeriesMap[dStr].produccion : 0
      });
    }

    res.json({
      kpis: {
        invertido: { current: totalInvertidoCurrent, last: totalInvertidoLast },
        producido: { current: totalProducidoCurrent, last: totalProducidoLast },
        despachado: { current: totalDespachadoCurrent, last: totalDespachadoLast }
      },
      topClients,
      topProducts,
      timeSeries
    });
  } catch (error) {
    console.error("Error en getGerenciaStats:", error);
    res.status(500).json({ error: error.message || 'Error al obtener métricas de gerencia', stack: error.stack });
  }
};

module.exports = {
  getAlmacenAlerts,
  getGerenciaStats
};
