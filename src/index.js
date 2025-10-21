const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { prisma, disconnect } = require('./database/prisma');
const { specs, swaggerUi } = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const facturasRoutes = require('./routes/facturas');
const pagosRoutes = require('./routes/pagos');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors(config.cors));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Documentación API con Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BigPagos API Documentation',
}));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/webhook', webhookRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BigPagos API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');

    // Iniciar servidor
    app.listen(config.port, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${config.port}`);
      console.log(`📱 Entorno: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
