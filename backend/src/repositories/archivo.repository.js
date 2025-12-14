import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  CREAR: 'sp_archivo_crear',
  LISTAR_POR_SOLICITUD: 'sp_archivo_obtener_por_solicitud',
  LISTAR_POR_SOLICITUD_TIPO: 'sp_archivo_obtener_por_solicitud_tipo',
  LISTAR_GENERAL: 'sp_archivo_listar_filtros',
  OBTENER_POR_ID: 'sp_archivo_obtener_por_id',
  ELIMINAR: 'sp_archivo_eliminar',
  ACTUALIZAR_REVISION: 'sp_archivo_actualizar_revision',
  RESUMEN_ESTADOS: 'sp_archivo_resumen_estados',
  ESTADISTICAS_TIPO: 'sp_archivo_estadisticas_tipo'
});

// Repositorio de Archivo Adjunto (SQL Server)

export class ArchivoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static normalizarDatosEntrada(datos) {
    return {
      id_solicitud: Number.parseInt(datos.id_solicitud, 10),
      tipo_archivo: datos.tipo_archivo || datos.tipoArchivo || datos.mime_type || null,
      nombre_archivo: datos.nombre_archivo || datos.nombreArchivo || 'archivo_sin_nombre',
      ruta_almacenamiento: datos.ruta_almacenamiento || datos.ruta_archivo,
      tamano_bytes: datos.tamano_bytes ?? datos.tamaño_bytes ?? datos.size ?? 0,
      mime_type: datos.mime_type || datos.tipo_contenido || null,
      hash_sha256: datos.hash_sha256 || null
    };
  }

  static formatearRegistro(record) {
    if (!record) {
      return null;
    }

    return {
      ...record,
      fecha_carga: record.fecha_carga || null,
      fecha_revision: record.fecha_revision || null
    };
  }

  static async crearArchivo(datos) {
    this.ensurePool();
    const payload = this.normalizarDatosEntrada(datos);

    if (!payload.id_solicitud || !payload.ruta_almacenamiento) {
      throw new Error('Datos incompletos para crear archivo adjunto');
    }

    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, payload.id_solicitud)
        .input('nombre_archivo', sql.VarChar(255), payload.nombre_archivo)
        .input('tipo_archivo', sql.VarChar(50), payload.tipo_archivo)
        .input('ruta_almacenamiento', sql.VarChar(500), payload.ruta_almacenamiento)
        .input('tamano_bytes', sql.Int, payload.tamano_bytes)
        .input('mime_type', sql.VarChar(50), payload.mime_type)
        .input('hash_sha256', sql.VarChar(64), payload.hash_sha256)
        .execute(STORED_PROCEDURES.CREAR);

      return {
        id_archivo: resultado.recordset?.[0]?.id_archivo,
        ...payload,
        estado_archivo: 'PENDIENTE_REVISION'
      };
    } catch (error) {
      console.error('Error en crearArchivo:', error);
      throw error;
    }
  }

  static async registrarArchivo(datos) {
    return this.crearArchivo(datos);
  }

  static async obtenerPorSolicitud(idSolicitud) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.LISTAR_POR_SOLICITUD);

      return resultado.recordset.map((record) => this.formatearRegistro(record));
    } catch (error) {
      console.error('Error en obtenerPorSolicitud:', error);
      throw error;
    }
  }

  static async listarPorSolicitudYTipo(idSolicitud, tipoArchivo) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .input('tipo_archivo', sql.VarChar(50), tipoArchivo)
        .execute(STORED_PROCEDURES.LISTAR_POR_SOLICITUD_TIPO);

      return resultado.recordset.map((record) => this.formatearRegistro(record));
    } catch (error) {
      console.error('Error en listarPorSolicitudYTipo:', error);
      throw error;
    }
  }

  static async listar(filtros = {}) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('tipo_archivo', sql.VarChar(50), filtros.tipo_archivo || null)
        .input('estado_archivo', sql.VarChar(50), filtros.estado_archivo || null)
        .execute(STORED_PROCEDURES.LISTAR_GENERAL);

      return resultado.recordset.map((record) => this.formatearRegistro(record));
    } catch (error) {
      console.error('Error en listar archivos:', error);
      throw error;
    }
  }

  static async obtenerPorId(idArchivo) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_archivo', sql.Int, Number.parseInt(idArchivo, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);

      return this.formatearRegistro(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error en obtenerPorId:', error);
      throw error;
    }
  }

  static async eliminarArchivo(idArchivo) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_archivo', sql.Int, Number.parseInt(idArchivo, 10))
        .execute(STORED_PROCEDURES.ELIMINAR);

      return { id_archivo: Number.parseInt(idArchivo, 10), eliminado: true };
    } catch (error) {
      console.error('Error en eliminarArchivo:', error);
      throw error;
    }
  }

  static async eliminar(idArchivo) {
    return this.eliminarArchivo(idArchivo);
  }

  static async actualizarRevision(idArchivo, estado, comentario, idEmpleado) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_archivo', sql.Int, Number.parseInt(idArchivo, 10))
        .input('estado_archivo', sql.VarChar(50), estado)
        .input('comentario_revision', sql.NVarChar(sql.MAX), comentario || '')
        .input('id_empleado_revision', sql.Int, idEmpleado ? Number.parseInt(idEmpleado, 10) : null)
        .execute(STORED_PROCEDURES.ACTUALIZAR_REVISION);

      return await this.obtenerPorId(idArchivo);
    } catch (error) {
      console.error('Error al actualizar revisión de archivo:', error);
      throw error;
    }
  }

  static async contarDocumentosCumpliendo(idSolicitud) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.RESUMEN_ESTADOS);

      return resultado.recordset?.[0] || { total: 0, cumpliendo: 0, no_cumpliendo: 0, pendiente: 0 };
    } catch (error) {
      console.error('Error en contarDocumentosCumpliendo:', error);
      throw error;
    }
  }

  static async obtenerEstadisticas() {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .execute(STORED_PROCEDURES.ESTADISTICAS_TIPO);

      const records = resultado.recordset || [];
      const accentKey = 'tama\u00f1o_total_bytes';
      return records.map((record) => {
        const totalBytes = record.tamano_total_bytes ?? record[accentKey] ?? 0;
        return {
          ...record,
          tamano_total_bytes: totalBytes,
          [accentKey]: totalBytes
        };
      });
    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      throw error;
    }
  }
}

export default ArchivoRepository;
