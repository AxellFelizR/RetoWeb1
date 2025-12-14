import express from 'express';
import PagoController from '../controllers/pago.controller.js';
import { requireEmpleado, requireSolicitante } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para gestión de pagos
 * Requieren autenticación como empleado o solicitante
 */

/**
 * Listar pagos (con filtros opcionales)
 * GET /api/pagos?estado_pago=...&metodo_pago=...&fechaDesde=...&fechaHasta=...
 */
router.get('/', requireEmpleado, PagoController.listar);

/**
 * Obtener resumen de pagos
 * GET /api/pagos/resumen
 */
router.get('/resumen/general', requireEmpleado, PagoController.obtenerResumen);

/**
 * Obtener pagos pendientes
 * GET /api/pagos/pendientes/lista
 */
router.get('/pendientes/lista', requireEmpleado, PagoController.listarPendientes);

/**
 * Obtener pago por ID
 * GET /api/pagos/:id
 */
router.get('/:id', requireEmpleado, PagoController.obtenerPorId);

/**
 * Obtener pagos por solicitud
 * GET /api/pagos/solicitud/:id_solicitud
 */
router.get('/solicitud/:id_solicitud', [requireEmpleado, requireSolicitante], PagoController.obtenerPorSolicitud);

/**
 * Crear nuevo pago
 * POST /api/pagos
 */
router.post('/', requireEmpleado, PagoController.crearPago);

/**
 * Actualizar estado del pago
 * PUT /api/pagos/:id/estado
 */
router.put('/:id/estado', requireEmpleado, PagoController.actualizarEstado);

export default router;
