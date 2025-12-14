import express from 'express';
import SolicitanteController from '../controllers/solicitante.controller.js';
import { requireSolicitante } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para gestión de solicitantes (obtener perfil, actualizar, etc.)
 * Requieren autenticación como solicitante
 */

/**
 * GET /api/solicitantes/perfil
 * Obtener perfil del solicitante autenticado
 */
router.get('/perfil', requireSolicitante, SolicitanteController.obtenerPerfil);

/**
 * PUT /api/solicitantes/perfil
 * Actualizar perfil del solicitante
 */
router.put('/perfil', requireSolicitante, SolicitanteController.actualizarPerfil);

/**
 * GET /api/solicitantes/mis-solicitudes
 * Obtener solicitudes del solicitante autenticado
 */
router.get('/mis-solicitudes', requireSolicitante, SolicitanteController.obtenerMisSolicitudes);

/**
 * POST /api/solicitantes/cambiar-contrasena
 * Cambiar contraseña del solicitante
 */
router.post('/cambiar-contrasena', requireSolicitante, SolicitanteController.cambiarContraseña);

/**
 * GET /api/solicitantes/verificar-email
 * Verificar si un email está disponible
 * Parámetro: ?email=...
 */
router.get('/verificar-email', SolicitanteController.verificarEmailDisponible);

export default router;
