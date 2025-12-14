import ArchivoRepository from '../repositories/archivo.repository.js';
import { ApiError } from '../utils/apiError.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Controlador de Archivos
 */
export class ArchivoController {
  /**
   * POST /api/archivos/subir
   * Subir archivo adjunto
   */
  static async subir(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('No se proporcionó archivo', 400);
      }

      const { id_solicitud, tipo_archivo } = req.body;

      if (!id_solicitud || !tipo_archivo) {
        throw new ApiError('id_solicitud y tipo_archivo son requeridos', 400);
      }

      // Validar tipos de archivo permitidos
      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!tiposPermitidos.includes(req.file.mimetype)) {
        throw new ApiError('Tipo de archivo no permitido', 400);
      }

      // Validar tamaño (máx 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new ApiError('El archivo es muy grande (máximo 50MB)', 400);
      }

      // Usar la ruta real que multer ya generó en disco para evitar desincronizaciones
      const rutaArchivo = req.file.path;

      // Registrar en BD
      const resultado = await ArchivoRepository.crearArchivo({
        id_solicitud: Number.parseInt(id_solicitud, 10),
        tipo_archivo,
        nombre_archivo: req.file.originalname,
        ruta_almacenamiento: rutaArchivo,
        tamano_bytes: req.file.size,
        mime_type: req.file.mimetype
      });

      res.status(201).json({
        success: true,
        message: 'Archivo subido exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

   // GET /api/archivos/solicitud/:id_solicitud
   // Obtener archivos de una solicitud

  static async obtenerPorSolicitud(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const resultado = await ArchivoRepository.obtenerPorSolicitud(id_solicitud);

      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/archivos/:id/revision
   * Actualizar estado de revisión
   */
  static async actualizarRevision(req, res, next) {
    try {
      const { id } = req.params;
      const { estado, comentario } = req.body;
      const idEmpleado = req.user.id_empleado;

      const estadosValidos = ['CUMPLE', 'NO_CUMPLE', 'PENDIENTE_REVISION'];
      if (!estado || !estadosValidos.includes(estado)) {
        throw new ApiError('Estado de revisión inválido', 400);
      }

      const resultado = await ArchivoRepository.actualizarRevision(
        id,
        estado,
        comentario || '',
        idEmpleado
      );

      res.json({
        success: true,
        message: 'Revisión actualizada exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/archivos/:id/descargar
   * Descargar archivo
   */
  static async descargar(req, res, next) {
    try {
      const { id } = req.params;
      const archivo = await ArchivoRepository.obtenerPorId(id);

      if (!archivo) {
        throw new ApiError('Archivo no encontrado', 404);
      }

      // Verificar permisos
      if (req.user.tipo_usuario === 'SOLICITANTE') {
        const SolicitudRepository = (await import('../repositories/solicitud.repository.js')).default;
        const solicitud = await SolicitudRepository.obtenerPorId(archivo.id_solicitud);
        if (solicitud.id_solicitante !== req.user.id_solicitante) {
          throw new ApiError('No tienes permiso para descargar este archivo', 403);
        }
      }

      const rutaFisica = path.resolve(archivo.ruta_almacenamiento);
      res.download(rutaFisica, archivo.nombre_archivo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/archivos/:id
   * Eliminar archivo
   */
  static async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      const archivo = await ArchivoRepository.obtenerPorId(id);

      if (!archivo) {
        throw new ApiError('Archivo no encontrado', 404);
      }

      // Eliminar del sistema de archivos
      try {
        await fs.unlink(archivo.ruta_archivo);
      } catch (err) {
        console.error('Error al eliminar archivo físico:', err);
      }

      // Eliminar del BD
      await ArchivoRepository.eliminarArchivo(id);

      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ArchivoController;
