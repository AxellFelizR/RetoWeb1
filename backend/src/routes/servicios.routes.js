import express from 'express';
import TipoServicioController from '../controllers/tipoServicio.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, TipoServicioController.listar);
router.post('/', verifyToken, requireRole(['ADMIN']), TipoServicioController.crear);

export default router;
