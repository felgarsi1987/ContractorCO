require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const cron         = require('node-cron');

const { pool }           = require('./config/database');
const logger             = require('./utils/logger');
const alertasService     = require('./services/alertasService');

// Rutas
const authRoutes          = require('./routes/auth');
const contratistasRoutes  = require('./routes/contratistas');
const contratosRoutes     = require('./routes/contratos');
const documentosRoutes    = require('./routes/documentos');
const supervisoresRoutes  = require('./routes/supervisores');
const alertasRoutes       = require('./routes/alertas');
const reportesRoutes      = require('./routes/reportes');
const usuariosRoutes      = require('./routes/usuarios');
const auditoriaRoutes     = require('./routes/auditoria');
const dashboardRoutes     = require('./routes/dashboard');

const app = express();

// ── Seguridad y middleware global ─────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas solicitudes, intente más tarde.' }
}));

// Rate limiting estricto para auth
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de autenticación.' }
}));

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/contratistas', contratistasRoutes);
app.use('/api/contratos',    contratosRoutes);
app.use('/api/documentos',   documentosRoutes);
app.use('/api/supervisores', supervisoresRoutes);
app.use('/api/alertas',      alertasRoutes);
app.use('/api/reportes',     reportesRoutes);
app.use('/api/usuarios',     usuariosRoutes);
app.use('/api/auditoria',    auditoriaRoutes);
app.use('/api/dashboard',    dashboardRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

// ── Manejo de errores global ──────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Cron jobs ─────────────────────────────────────────────────
// Actualizar estados de vencimiento — cada día a las 6 AM
cron.schedule('0 6 * * *', async () => {
  logger.info('Cron: actualizando estados de vencimiento...');
  await alertasService.procesarVencimientos();
  logger.info('Cron: estados actualizados.');
});

// ── Servidor ──────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
