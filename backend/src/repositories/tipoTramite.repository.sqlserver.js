import sql from 'mssql';
import db from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  OBTENER_POR_ID: 'sp_tipo_tramite_obtener_por_id',
  OBTENER_POR_NOMBRE: 'sp_tipo_tramite_obtener_por_nombre',
  CREAR: 'sp_tipo_tramite_crear',
  LISTAR_POR_SERVICIO: 'sp_tipo_tramite_listar_por_servicio'
});

export class TipoTramiteRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static async obtenerPorId(id) {
    if (!id) {
      return null;
    }

    this.ensurePool();
    const result = await db.pool.request()
      .input('id_tipo_tramite', sql.Int, Number.parseInt(id, 10))
      .execute(STORED_PROCEDURES.OBTENER_POR_ID);

    return result.recordset?.[0] || null;
  }

  static async obtenerPorNombre(nombre, idTipoServicio = null) {
    if (!nombre) {
      return null;
    }

    this.ensurePool();
    const request = db.pool.request()
      .input('nombre_tramite', sql.VarChar(100), nombre.trim());

    if (idTipoServicio) {
      request.input('id_tipo_servicio', sql.Int, Number.parseInt(idTipoServicio, 10));
    }

    const result = await request.execute(STORED_PROCEDURES.OBTENER_POR_NOMBRE);
    return result.recordset?.[0] || null;
  }

  static async crear({
    id_tipo_servicio,
    nombre_tramite,
    descripcion = null,
    requiere_costo = false,
    costo_tramite = 0,
    campos_obligatorios = null
  }) {
    this.ensurePool();
    const result = await db.pool.request()
      .input('id_tipo_servicio', sql.Int, Number.parseInt(id_tipo_servicio, 10))
      .input('nombre_tramite', sql.VarChar(100), nombre_tramite)
      .input('descripcion', sql.VarChar(500), descripcion)
      .input('requiere_costo', sql.Bit, requiere_costo ? 1 : 0)
      .input('costo_tramite', sql.Decimal(10, 2), costo_tramite || 0)
      .input('campos_obligatorios', sql.NVarChar(sql.MAX), campos_obligatorios)
      .execute(STORED_PROCEDURES.CREAR);

    return result.recordset?.[0] || null;
  }

  static async listarPorServicio(idTipoServicio) {
    this.ensurePool();
    const request = db.pool.request();

    if (idTipoServicio) {
      request.input('id_tipo_servicio', sql.Int, Number.parseInt(idTipoServicio, 10));
    }

    const result = await request.execute(STORED_PROCEDURES.LISTAR_POR_SERVICIO);
    return result.recordset || [];
  }
}

export default TipoTramiteRepository;
