import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/auth/registro-solicitante
 * Registro de nuevo solicitante
 */
router.post('/registro-solicitante', AuthController.registroSolicitante);

/**
 * POST /api/auth/login-solicitante
 * Login de solicitante
 */
router.post('/login-solicitante', AuthController.loginSolicitante);

/**
 * POST /api/auth/login-empleado
 * Login de empleado
 */
router.post('/login-empleado', AuthController.loginEmpleado);

/**
 * POST /api/auth/cambiar-contraseña (legacy)
 * POST /api/auth/cambiar-password (ASCII friendly)
 * Cambiar contraseña del usuario autenticado
 */
router.post('/cambiar-contraseña', verifyToken, AuthController.cambiarContraseña);
router.post('/cambiar-password', verifyToken, AuthController.cambiarContraseña);

/**
 * POST /api/auth/solicitante/confirmar-email
 */
router.post('/solicitante/confirmar-email', AuthController.confirmarEmailSolicitante);

/**
 * POST /api/auth/solicitante/solicitar-reset
 */
router.post('/solicitante/solicitar-reset', AuthController.solicitarResetPasswordSolicitante);

/**
 * POST /api/auth/solicitante/restablecer-password
 */
router.post('/solicitante/restablecer-password', AuthController.restablecerPasswordSolicitante);

/**
 * POST /api/auth/empleado/confirmar-email
 */
router.post('/empleado/confirmar-email', AuthController.confirmarEmailEmpleado);

/**
 * POST /api/auth/empleado/solicitar-reset
 */
router.post('/empleado/solicitar-reset', AuthController.solicitarResetPasswordEmpleado);

/**
 * POST /api/auth/empleado/restablecer-password
 */
router.post('/empleado/restablecer-password', AuthController.restablecerPasswordEmpleado);

/**
 * GET /api/auth/verify
 * Verificar token
 */
router.get('/verify', verifyToken, AuthController.verify);

export default router;
