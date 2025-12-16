import express from 'express';
import FormularioRequisitoController from '../controllers/formularioRequisito.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/publico', FormularioRequisitoController.listarPublico);
router.get('/', verifyToken, FormularioRequisitoController.listar);
router.post('/', verifyToken, requireRole(['ADMIN']), FormularioRequisitoController.crear);
router.put('/:idRequisito', verifyToken, requireRole(['ADMIN']), FormularioRequisitoController.actualizar);

export default router;
