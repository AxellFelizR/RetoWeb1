import sql from 'mssql';
import db from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  LISTAR: 'sp_tipo_servicio_listar',
  OBTENER_POR_NOMBRE: 'sp_tipo_servicio_obtener_por_nombre',
  OBTENER_POR_ID: 'sp_tipo_servicio_obtener_por_id',
  CREAR: 'sp_tipo_servicio_crear'
});

export class TipoServicioRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static async listar({ incluirInactivos = false } = {}) {
    this.ensurePool();
    const result = await db.pool.request()
      .input('incluir_inactivos', sql.Bit, incluirInactivos ? 1 : 0)
      .execute(STORED_PROCEDURES.LISTAR);

    return (result.recordset || []).map(TipoServicioRepository.mapRecord);
  }

  static mapRecord(record) {
    if (!record) return null;
    return {
      id_tipo_servicio: record.id_tipo_servicio,
      nombre_servicio: record.nombre_servicio,
      descripcion: record.descripcion,
      requiere_costo_administrativo: Boolean(record.requiere_costo_administrativo),
      costo_administrativo: record.costo_administrativo ? Number(record.costo_administrativo) : 0,
      dias_respuesta: record.dias_respuesta ? Number(record.dias_respuesta) : null,
      estado_servicio: record.estado_servicio
    };
  }

  static async obtenerPorNombre(nombre) {
    this.ensurePool();
    const result = await db.pool.request()
      .input('nombre_servicio', sql.NVarChar(100), nombre)
      .execute(STORED_PROCEDURES.OBTENER_POR_NOMBRE);

    return result.recordset?.[0] || null;
  }

  static async obtenerPorId(id) {
    this.ensurePool();
    const result = await db.pool.request()
      .input('id_tipo_servicio', sql.Int, Number.parseInt(id, 10))
      .execute(STORED_PROCEDURES.OBTENER_POR_ID);

    return TipoServicioRepository.mapRecord(result.recordset?.[0]) || null;
  }

  static async crear(datos) {
    this.ensurePool();
    const result = await db.pool.request()
      .input('nombre_servicio', sql.NVarChar(100), datos.nombre_servicio)
      .input('descripcion', sql.NVarChar(500), datos.descripcion || null)
      .input('requiere_costo', sql.Bit, datos.requiere_costo_administrativo ? 1 : 0)
      .input('costo_administrativo', sql.Decimal(10, 2), datos.costo_administrativo ?? null)
      .input('dias_respuesta', sql.Int, Number.parseInt(datos.dias_respuesta, 10) || 0)
      .input('estado_servicio', sql.VarChar(20), datos.estado_servicio || 'ACTIVO')
      .execute(STORED_PROCEDURES.CREAR);

    return this.mapRecord(result.recordset?.[0] || null);
  }
}

export default TipoServicioRepository;
