import fs from 'fs/promises';
import { ApiError } from '../utils/apiError.js';
import { ArchivoRepository } from '../repositories/archivo.repository.js';
import { SolicitudRepository } from '../repositories/solicitud.repository.js';

/**
 * Servicio de Archivos
 */
export class ArchivoService {
  /**
   * Crear registro de archivo
   */
  static async crearArchivo(datos) {
    try {
      const { id_solicitud } = datos;

      const solicitud = await SolicitudRepository.obtenerPorId(id_solicitud);

      if (!solicitud) {
        throw new ApiError('Solicitud no encontrada', 404);
      }

      return await ArchivoRepository.crearArchivo(datos);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener archivo por ID
   */
  static async obtenerPorId(id) {
    try {
      return await ArchivoRepository.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener archivos por solicitud
   */
  static async obtenerPorSolicitud(idSolicitud) {
    try {
      return await ArchivoRepository.obtenerPorSolicitud(idSolicitud);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener archivos por solicitud y categoría
   */
  static async obtenerPorSolicitudYTipo(idSolicitud, tipoArchivo) {
    try {
      return await ArchivoRepository.listarPorSolicitudYTipo(idSolicitud, tipoArchivo);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar archivos con filtros
   */
  static async listar(filtros = {}) {
    try {
      return await ArchivoRepository.listar(filtros);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar archivo (elimina BD y archivo físico)
   */
  static async eliminarArchivo(id) {
    try {
      const archivo = await ArchivoRepository.obtenerPorId(id);

      if (!archivo) {
        throw new ApiError('Archivo no encontrado', 404);
      }

      // Eliminar archivo físico
      try {
        await fs.unlink(archivo.ruta_almacenamiento);
      } catch (fsError) {
        console.error('Error eliminando archivo físico:', fsError);
        // Continuar aunque falle eliminación física
      }

      // Eliminar registro en BD
      await ArchivoRepository.eliminarArchivo(id);

      return { id_archivo: id, eliminado: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener información de archivo para descarga
   */
  static async obtenerParaDescarga(id) {
    try {
      const archivo = await ArchivoRepository.obtenerPorId(id);

      if (!archivo) {
        throw new ApiError('Archivo no encontrado', 404);
      }

      // Verificar que el archivo existe
      try {
        await fs.access(archivo.ruta_almacenamiento);
      } catch {
        throw new ApiError('Archivo no disponible en servidor', 500);
      }

      return archivo;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de archivos
   */
  static async obtenerEstadisticas() {
    try {
      return await ArchivoRepository.obtenerEstadisticas();
    } catch (error) {
      throw error;
    }
  }
}

export default ArchivoService;
