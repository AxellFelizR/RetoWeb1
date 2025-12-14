import express from 'express';
import EmpleadoController from '../controllers/empleado.controller.js';
import { requireEmpleado, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Rutas para gestión de empleados
 * Requieren autenticación como empleado
 */

/**
 * Listar empleados (con filtros opcionales)
 * GET /api/empleados?rol=...&departamento=...&estado_empleado=...
 */
router.get('/', requireEmpleado, EmpleadoController.listar);

/**
 * Obtener empleado por ID
 * GET /api/empleados/:id
 */
router.get('/:id', requireEmpleado, EmpleadoController.obtenerPorId);

/**
 * Crear nuevo empleado (solo admin/gerente)
 * POST /api/empleados
 */
router.post('/', requireRole(['ADMIN']), EmpleadoController.crearEmpleado);

/**
 * Actualizar empleado
 * PUT /api/empleados/:id
 */
router.put('/:id', requireRole(['ADMIN']), EmpleadoController.actualizar);

/**
 * Eliminar empleado (soft delete)
 * DELETE /api/empleados/:id
 */
router.delete('/:id', requireRole(['ADMIN']), EmpleadoController.eliminar);

/**
 * Cambiar contraseña del empleado
 * POST /api/empleados/:id/cambiar-contrasena
 */
router.post('/:id/cambiar-contrasena', requireEmpleado, EmpleadoController.cambiarContraseña);

export default router;
