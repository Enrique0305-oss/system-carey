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
app.use('/api/produccion', produccionRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(` Servidor Backend MVC corriendo en http://localhost:${PORT}`);
});
