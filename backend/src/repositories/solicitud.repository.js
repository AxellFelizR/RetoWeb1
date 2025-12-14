import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  CREAR: 'sp_solicitud_crear',
  OBTENER_POR_ID: 'sp_solicitud_obtener_por_id',
  CAMBIAR_ESTADO: 'sp_solicitud_cambiar_estado',
  ACTUALIZAR_DATOS: 'sp_solicitud_actualizar_datos',
  OBTENER_HISTORIAL: 'sp_solicitud_obtener_historial',
  OBTENER_SUSTANCIAS: 'sp_solicitud_obtener_sustancias',
  AGREGAR_SUSTANCIA: 'sp_solicitud_agregar_sustancia',
  LISTAR_POR_ESTADO: 'sp_solicitud_listar_por_estado',
  ELIMINAR: 'sp_solicitud_eliminar'
});

const parseJsonField = (value) => {
  if (!value) return null;
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch (error) {
    console.warn('No se pudo parsear JSON de solicitud:', error);
    return null;
  }
};

const mapSolicitudRecord = (record) => {
  if (!record) return null;
  const mapped = { ...record };
  mapped.datos_servicio = parseJsonField(record.datos_servicio_json);
  mapped.documentos_reportados = parseJsonField(record.documentos_reportados_json);
  mapped.ultimo_estado = record.ultimo_estado ?? null;
  mapped.ultimo_cambio_fecha = record.ultimo_cambio_fecha ?? null;
  mapped.ultimo_cambio_por = record.ultimo_cambio_por ?? null;
  delete mapped.datos_servicio_json;
  delete mapped.documentos_reportados_json;
  return mapped;
};

export class SolicitudRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static async crearSolicitud(datos) {
    this.ensurePool();
    try {
      const request = db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(datos.id_solicitante, 10))
        .input('id_tipo_servicio', sql.Int, Number.parseInt(datos.id_tipo_servicio, 10))
        .input('id_tipo_tramite', sql.Int, Number.parseInt(datos.id_tipo_tramite, 10))
        .input('prioridad', sql.VarChar(20), datos.prioridad || 'NORMAL')
        .input('fecha_vencimiento', sql.Date, datos.fecha_vencimiento || null)
        .input('id_empleado_asignado', sql.Int, datos.id_empleado_asignado || null)
        .input('numero_cidc_anterior', sql.VarChar(50), datos.numero_cidc_anterior || null)
        .input('motivo_detalle', sql.NVarChar(sql.MAX), datos.motivo_detalle || null)
        .input('datos_servicio_json', sql.NVarChar(sql.MAX), datos.datos_servicio ? JSON.stringify(datos.datos_servicio) : null)
        .input('documentos_reportados_json', sql.NVarChar(sql.MAX), datos.documentos_reportados ? JSON.stringify(datos.documentos_reportados) : null)
        .input('resumen_pago_label', sql.NVarChar(150), datos.resumen_pago_label || null)
        .input('monto_total_reportado', sql.Decimal(12, 2), datos.monto_total_reportado ?? null);

      const resultado = await request.execute(STORED_PROCEDURES.CREAR);
      const idSolicitud = resultado.recordset?.[0]?.id_solicitud;
      return await this.obtenerPorId(idSolicitud);
    } catch (error) {
      console.error('Error creando solicitud:', error);
      throw error;
    }
  }

  static async obtenerPorId(idSolicitud) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);

      return mapSolicitudRecord(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo solicitud por ID:', error);
      throw error;
    }
  }

  static async cambiarEstado(idSolicitud, nuevoEstado) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .input('estado_solicitud', sql.VarChar(50), nuevoEstado)
        .execute(STORED_PROCEDURES.CAMBIAR_ESTADO);

      const filasAfectadas = resultado.recordset?.[0]?.filas_afectadas || 0;
      return {
        id_solicitud: Number.parseInt(idSolicitud, 10),
        estado_solicitud: nuevoEstado,
        cambioAplicado: filasAfectadas > 0
      };
    } catch (error) {
      console.error('Error cambiando estado de solicitud:', error);
      throw error;
    }
  }

  static async actualizarDatosSolicitante(idSolicitud, datos) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .input('id_tipo_servicio', sql.Int, Number.parseInt(datos.id_tipo_servicio, 10))
        .input('id_tipo_tramite', sql.Int, Number.parseInt(datos.id_tipo_tramite, 10))
        .input('numero_cidc_anterior', sql.VarChar(50), datos.numero_cidc_anterior || null)
        .input('motivo_detalle', sql.NVarChar(sql.MAX), datos.motivo_detalle || null)
        .input('datos_servicio_json', sql.NVarChar(sql.MAX), datos.datos_servicio ? JSON.stringify(datos.datos_servicio) : null)
        .input('documentos_reportados_json', sql.NVarChar(sql.MAX), datos.documentos_reportados ? JSON.stringify(datos.documentos_reportados) : null)
        .input('resumen_pago_label', sql.NVarChar(150), datos.resumen_pago_label || null)
        .input('monto_total_reportado', sql.Decimal(12, 2), datos.monto_total_reportado ?? null)
        .execute(STORED_PROCEDURES.ACTUALIZAR_DATOS);

      return await this.obtenerPorId(idSolicitud);
    } catch (error) {
      console.error('Error actualizando datos de solicitud:', error);
      throw error;
    }
  }

  static async obtenerHistorial(idSolicitud) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.OBTENER_HISTORIAL);

      return resultado.recordset || [];
    } catch (error) {
      console.error('Error obteniendo historial de solicitud:', error);
      throw error;
    }
  }

  static async obtenerSustancias(idSolicitud) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.OBTENER_SUSTANCIAS);

      return resultado.recordset || [];
    } catch (error) {
      console.error('Error obteniendo sustancias de solicitud:', error);
      throw error;
    }
  }

  static async agregarSustancia(idSolicitud, dataSustancia) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .input('id_sustancia', sql.Int, Number.parseInt(dataSustancia.id_sustancia, 10))
        .input('cantidad_solicitada', sql.Decimal(18, 3), dataSustancia.cantidad || 0)
        .input('unidad_medida', sql.VarChar(20), dataSustancia.unidad_medida || 'KG')
        .execute(STORED_PROCEDURES.AGREGAR_SUSTANCIA);

      return { id: resultado.recordset?.[0]?.id };
    } catch (error) {
      console.error('Error agregando sustancia:', error);
      throw error;
    }
  }

  static async listarPorEstado(estado, pagina = 1, porPagina = 20, filtros = {}) {
    this.ensurePool();
    try {
      const skip = (pagina - 1) * porPagina;
      const resultado = await db.pool.request()
        .input('estado', sql.VarChar(50), estado || null)
        .input('id_solicitante', sql.Int, filtros.id_solicitante ? Number.parseInt(filtros.id_solicitante, 10) : null)
        .input('skip', sql.Int, skip)
        .input('take', sql.Int, porPagina)
        .execute(STORED_PROCEDURES.LISTAR_POR_ESTADO);

      const records = resultado.recordset || [];
      return records.map((record) => mapSolicitudRecord(record));
    } catch (error) {
      console.error('Error listando solicitudes por estado:', error);
      throw error;
    }
  }

  static async eliminarSolicitud(idSolicitud) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.ELIMINAR);

      return { id_solicitud: Number.parseInt(idSolicitud, 10), eliminado: true };
    } catch (error) {
      console.error('Error eliminando solicitud:', error);
      throw error;
    }
  }
}

export default SolicitudRepository;
