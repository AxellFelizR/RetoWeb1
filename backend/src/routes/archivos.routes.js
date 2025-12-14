import express from 'express';
import multer from 'multer';
import ArchivoController from '../controllers/archivo.controller.js';
import { verifyToken, requireEmpleado } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const nombreUnico = `${Date.now()}_${file.originalname}`;
    cb(null, nombreUnico);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

/**
 * POST /api/archivos/subir
 * Subir archivo adjunto a una solicitud
 */
router.post('/subir', verifyToken, upload.single('archivo'), ArchivoController.subir);

/**
 * GET /api/archivos/solicitud/:id_solicitud
 * Obtener archivos de una solicitud
 */
router.get('/solicitud/:id_solicitud', verifyToken, ArchivoController.obtenerPorSolicitud);

/**
 * PATCH /api/archivos/:id/revision
 * Actualizar estado de revisión (empleados)
 */
router.patch('/:id/revision', verifyToken, requireEmpleado, ArchivoController.actualizarRevision);

/**
 * GET /api/archivos/:id/descargar
 * Descargar archivo
 */
router.get('/:id/descargar', verifyToken, ArchivoController.descargar);

/**
 * DELETE /api/archivos/:id
 * Eliminar archivo
 */
router.delete('/:id', verifyToken, ArchivoController.eliminar);

export default router;
