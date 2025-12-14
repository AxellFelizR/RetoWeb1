import express from 'express';
import multer from 'multer';
import SolicitudController from '../controllers/solicitud.controller.js';
import { verifyToken, requireSolicitante, requireEmpleado, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para uploads
const upload = multer({ dest: 'uploads/solicitudes/' });

/**
 * POST /api/solicitudes
 * Crear nueva solicitud (SOLICITANTE)
 */
router.post('/', verifyToken, requireSolicitante, SolicitudController.crearSolicitud);

/**
 * GET /api/solicitudes/mis-solicitudes
 * Listar mis solicitudes (SOLICITANTE)
 */
router.get('/mis-solicitudes', verifyToken, requireSolicitante, SolicitudController.listarDelSolicitante);

/**
 * GET /api/solicitudes
 * Listar mis solicitudes (SOLICITANTE)
 */
router.get('/', verifyToken, requireSolicitante, SolicitudController.listarDelSolicitante);

/**
 * GET /api/solicitudes/admin/auditoria
 * Listar todas las solicitudes para auditoría (ADMIN)
 */
router.get('/admin/auditoria', verifyToken, requireRole(['ADMIN']), SolicitudController.listarAuditoria);

/**
 * GET /api/solicitudes/estado/:estado
 * Listar solicitudes por estado (EMPLEADO)
 */
router.get('/estado/:estado', verifyToken, requireEmpleado, SolicitudController.listarPorEstado);

/**
 * GET /api/solicitudes/:id/revision-campos
 * Obtener revisión de campos (EMPLEADO)
 */
router.get('/:id/revision-campos', verifyToken, requireEmpleado, SolicitudController.obtenerRevisionCampos);

/**
 * PUT /api/solicitudes/:id/revision-campos
 * Actualizar revisión de campos (EMPLEADO)
 */
router.put('/:id/revision-campos', verifyToken, requireEmpleado, SolicitudController.guardarRevisionCampos);

/**
 * GET /api/solicitudes/:id
 * Obtener detalle completo de solicitud
 */
router.get('/:id', verifyToken, SolicitudController.obtenerDetalle);

/**
 * PUT /api/solicitudes/:id/estado
 * Cambiar estado de solicitud (EMPLEADO)
 */
router.put('/:id/estado', verifyToken, requireEmpleado, SolicitudController.cambiarEstado);

/**
 * PUT /api/solicitudes/:id/reenviar
 * Reenviar solicitud devuelta (SOLICITANTE)
 */
router.put('/:id/reenviar', verifyToken, requireSolicitante, SolicitudController.reenviarCorrecciones);

/**
 * POST /api/solicitudes/:id/sustancias
 * Agregar sustancia controlada a solicitud
 */
router.post('/:id/sustancias', verifyToken, SolicitudController.agregarSustancia);

/**
 * GET /api/solicitudes/:id/historial
 * Obtener historial de cambios de estado
 */
router.get('/:id/historial', verifyToken, SolicitudController.obtenerHistorial);

/**
 * POST /api/solicitudes/:id/archivos
 * Subir archivo adjunto a solicitud
 */
router.post('/:id/archivos', verifyToken, upload.single('file'), SolicitudController.subirArchivo);

/**
 * GET /api/solicitudes/:id/archivos
 * Obtener archivos adjuntos de solicitud
 */
router.get('/:id/archivos', verifyToken, SolicitudController.obtenerArchivos);

/**
 * DELETE /api/solicitudes/:id/archivos/:idArchivo
 * Eliminar archivo adjunto
 */
router.delete('/:id/archivos/:idArchivo', verifyToken, SolicitudController.eliminarArchivo);

export default router;
