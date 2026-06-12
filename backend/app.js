require('dotenv').config();

const express = require('express');
const cors = require('cors');
const prisma = require('./database/connection');

// Importar rutas
const almacenRoutes = require('./routes/almacenRoutes');
const productoRoutes = require('./routes/productoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const kardexRoutes = require('./routes/kardexRoutes');
const authRoutes = require('./routes/authRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const providerRoutes = require('./routes/providerRoutes');
const ajustesRoutes = require('./routes/ajustesRoutes');
const produccionRoutes = require('./routes/produccion.routes');
const clientRoutes = require('./routes/clientRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const traceabilityRoutes = require('./routes/traceabilityRoutes');
const userRoutes = require('./routes/userRoutes');
const internalConsumptionRoutes = require('./routes/internalConsumptionRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Rutas
app.use('/api/warehouses', almacenRoutes);
app.use('/api/products', productoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/kardex', kardexRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/ajustes', ajustesRoutes);
const recipeRoutes = require('./routes/recipeRoutes');
app.use('/api/products', recipeRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/internal-consumptions', internalConsumptionRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(` Servidor Backend MVC corriendo en http://localhost:${PORT}`);
});
