import express from 'express';
import CertificadosController from '../controllers/certificados.controller.js';
import { requireEmpleado, requireSolicitante, requireEmpleadoOrSolicitante } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para gestión de certificados emitidos
 */

/**
 * POST /api/certificados/generar/:id_solicitud
 * Generar certificado para solicitud aprobada
 */
router.post('/generar/:id_solicitud', requireEmpleado, CertificadosController.generarCertificado);

/**
 * GET /api/certificados
 * Listar certificados con filtros
 * Parámetros: ?estado=...&fechaDesde=...&fechaHasta=...
 */
router.get('/', requireEmpleado, CertificadosController.listar);

/**
 * GET /api/certificados/estadisticas
 * Obtener estadísticas de certificados
 */
router.get('/estadisticas/general', requireEmpleado, CertificadosController.obtenerEstadisticas);

/**
 * GET /api/certificados/solicitud/:id_solicitud
 * Obtener certificado por solicitud
 */
router.get('/solicitud/:id_solicitud', requireEmpleadoOrSolicitante, CertificadosController.obtenerPorSolicitud);

/**
 * GET /api/certificados/solicitud/:id_solicitud/descargar
 * Descargar certificado asociado a una solicitud
 */
router.get('/solicitud/:id_solicitud/descargar', requireEmpleadoOrSolicitante, CertificadosController.descargarPorSolicitud);

/**
 * GET /api/certificados/:id/descargar
 * Descargar certificado (PDF)
 */
router.get('/:id/descargar', requireEmpleadoOrSolicitante, CertificadosController.descargarCertificado);

/**
 * GET /api/certificados/:id
 * Obtener certificado por ID
 */
router.get('/:id', requireEmpleadoOrSolicitante, CertificadosController.obtenerCertificado);

/**
 * PUT /api/certificados/:id/estado
 * Actualizar estado de certificado
 */
router.put('/:id/estado', requireEmpleado, CertificadosController.actualizarEstado);

export default router;
