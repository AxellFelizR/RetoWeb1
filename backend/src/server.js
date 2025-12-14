import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import AuthController from './controllers/auth.controller.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import solicitantesRoutes from './routes/solicitantes.routes.js';
import solicitudesRoutes from './routes/solicitudes.routes.js';
import archivosRoutes from './routes/archivos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import certificadosRoutes from './routes/certificados.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import bandejaRoutes from './routes/bandeja.routes.js';
import serviciosRoutes from './routes/servicios.routes.js';

// Middleware de error
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, intente más tarde.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================
// RUTAS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Enlaces públicos para confirmación/activación
app.get('/confirmar', AuthController.confirmarEmailSolicitanteLink);
app.get('/activar-empleado', AuthController.confirmarEmailEmpleadoLink);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/solicitantes', solicitantesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/archivos', archivosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/bandeja', bandejaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/servicios', serviciosRoutes);

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// ============================================
// MANEJO GLOBAL DE ERRORES
// ============================================

app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
    
      Servidor ejecutándose en puerto: ${PORT}
      Entorno: ${process.env.NODE_ENV}
      URL: http://localhost:${PORT} 
    
  `);
});

export default app;
