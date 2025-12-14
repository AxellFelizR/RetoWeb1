import express from 'express';
import ReportesController from '../controllers/reportes.controller.js';
import { requireEmpleado } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para Reportes del Sistema
 * Solo accesible para empleados con rol ADMIN o GERENTE
 */

/**
 * GET /api/reportes/solicitudes/estado
 * Reporte de solicitudes por estado
 */
router.get('/solicitudes/estado', requireEmpleado, ReportesController.reportePorEstado);

/**
 * GET /api/reportes/solicitudes/mes
 * Reporte de solicitudes por mes
 */
router.get('/solicitudes/mes', requireEmpleado, ReportesController.reportePorMes);

/**
 * GET /api/reportes/solicitudes/solicitante
 * Reporte de solicitudes por solicitante
 * Parámetro opcional: ?id_solicitante=...
 */
router.get('/solicitudes/solicitante', requireEmpleado, ReportesController.reportePorSolicitante);

/**
 * GET /api/reportes/sustancias
 * Reporte de sustancias solicitadas
 */
router.get('/sustancias', requireEmpleado, ReportesController.reporteSustancias);

/**
 * GET /api/reportes/pagos
 * Reporte de pagos
 * Parámetro opcional: ?estado=...
 */
router.get('/pagos', requireEmpleado, ReportesController.reportePagos);

/**
 * GET /api/reportes/archivos
 * Reporte de archivos
 */
router.get('/archivos', requireEmpleado, ReportesController.reporteArchivos);

/**
 * GET /api/reportes/general
 * Reporte general del sistema
 */
router.get('/general', requireEmpleado, ReportesController.reporteGeneral);

/**
 * GET /api/reportes/actividad/empleado
 * Reporte de actividad por empleado
 */
router.get('/actividad/empleado', requireEmpleado, ReportesController.reporteActividadEmpleado);

export default router;
