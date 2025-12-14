import express from 'express';
import BandejaController from '../controllers/bandeja.controller.js';
import { requireEmpleado } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para Bandeja de Trabajo
 * Diferentes vistas según el rol del empleado
 */

// ===================== BANDEJA VENTANILLA =====================

/**
 * GET /api/bandeja/ventanilla
 * Obtener solicitudes en bandeja de ventanilla (REGISTRADA)
 */
router.get('/ventanilla', requireEmpleado, BandejaController.obtenerSolicitudesVentanilla);

/**
 * PUT /api/bandeja/ventanilla/:id_solicitud/validar
 * Validar solicitud en ventanilla (cambiar a VALIDADA)
 */
router.put('/ventanilla/:id_solicitud/validar', requireEmpleado, BandejaController.validarSolicitudVentanilla);

/**
 * PUT /api/bandeja/ventanilla/:id_solicitud/rechazar
 * Rechazar solicitud en ventanilla
 */
router.put('/ventanilla/:id_solicitud/rechazar', requireEmpleado, BandejaController.rechazarSolicitudVentanilla);

// ===================== BANDEJA UPC =====================

/**
 * GET /api/bandeja/upc
 * Obtener solicitudes en bandeja UPC (VALIDADA)
 */
router.get('/upc', requireEmpleado, BandejaController.obtenerSolicitudesUPC);

/**
 * PUT /api/bandeja/upc/:id_solicitud/revisar
 * Revisar solicitud en UPC (cambiar a EN_REVISION_UPC)
 */
router.put('/upc/:id_solicitud/revisar', requireEmpleado, BandejaController.revisarSolicitudUPC);

// ===================== BANDEJA DIRECCIÓN =====================

/**
 * GET /api/bandeja/direccion
 * Obtener solicitudes en bandeja de Dirección (EN_REVISION_UPC)
 */
router.get('/direccion', requireEmpleado, BandejaController.obtenerSolicitudesDireccion);

/**
 * PUT /api/bandeja/direccion/:id_solicitud/aprobar
 * Aprobar solicitud desde Dirección (cambiar a APROBADA)
 */
router.put('/direccion/:id_solicitud/aprobar', requireEmpleado, BandejaController.aprobarSolicitudDireccion);

/**
 * PUT /api/bandeja/direccion/:id_solicitud/rechazar
 * Rechazar solicitud desde Dirección
 */
router.put('/direccion/:id_solicitud/rechazar', requireEmpleado, BandejaController.rechazarSolicitudDireccion);

// ===================== BANDEJA DNCD =====================

/**
 * GET /api/bandeja/dncd
 * Obtener solicitudes en bandeja DNCD (APROBADA)
 */
router.get('/dncd', requireEmpleado, BandejaController.obtenerSolicitudesDNCD);

/**
 * PUT /api/bandeja/dncd/:id_solicitud/resolucion
 * Emitir resolución DNCD (cambiar a RESOLUCION_EMITIDA)
 */
router.put('/dncd/:id_solicitud/resolucion', requireEmpleado, BandejaController.emitirResolucionDNCD);

/**
 * POST /api/bandeja/dncd/:id_solicitud/certificado
 * Generar certificado DNCD
 */
router.post('/dncd/:id_solicitud/certificado', requireEmpleado, BandejaController.generarCertificadoDNCD);

// ===================== GENERAL =====================

/**
 * GET /api/bandeja/resumen
 * Obtener resumen de solicitudes por estado
 */
router.get('/resumen/general', requireEmpleado, BandejaController.obtenerResumenBandeja);

export default router;
