import sql from 'mssql';
import db from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  LISTAR: 'sp_formulario_requisito_listar',
  GUARDAR: 'sp_formulario_requisito_guardar'
});

export class FormularioRequisitoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static mapRecord(record) {
    if (!record) return null;
    return {
      id_requisito: record.id_requisito,
      id_tipo_servicio: record.id_tipo_servicio,
      id_tipo_tramite: record.id_tipo_tramite,
      nombre_corto: record.nombre_corto,
      descripcion: record.descripcion,
      es_obligatorio: Boolean(record.es_obligatorio),
      tipo_input: record.tipo_input,
      tipo_archivo_permitido: record.tipo_archivo_permitido,
      tamano_max_mb: record.tamano_max_mb != null ? Number(record.tamano_max_mb) : null,
      orden_visual: record.orden_visual != null ? Number(record.orden_visual) : null,
      activo: Boolean(record.activo)
    };
  }

  static async listar({ idTipoServicio = null, idTipoTramite = null, soloActivos = true } = {}) {
    this.ensurePool();

    const request = db.pool.request()
      .input('id_tipo_servicio', sql.Int, idTipoServicio ? Number.parseInt(idTipoServicio, 10) : null)
      .input('id_tipo_tramite', sql.Int, idTipoTramite ? Number.parseInt(idTipoTramite, 10) : null)
      .input('solo_activos', sql.Bit, soloActivos ? 1 : 0);

    const result = await request.execute(STORED_PROCEDURES.LISTAR);
    return (result.recordset || []).map(FormularioRequisitoRepository.mapRecord);
  }

  static async guardar({
    id_requisito = null,
    id_tipo_servicio = null,
    id_tipo_tramite = null,
    nombre_corto,
    descripcion = null,
    es_obligatorio = true,
    tipo_input = 'archivo',
    tipo_archivo_permitido = null,
    tamano_max_mb = null,
    orden_visual = 1,
    activo = true
  }) {
    this.ensurePool();

    const request = db.pool.request()
      .input('id_requisito', sql.Int, id_requisito ? Number.parseInt(id_requisito, 10) : null)
      .input('id_tipo_servicio', sql.Int, id_tipo_servicio ? Number.parseInt(id_tipo_servicio, 10) : null)
      .input('id_tipo_tramite', sql.Int, id_tipo_tramite ? Number.parseInt(id_tipo_tramite, 10) : null)
      .input('nombre_corto', sql.VarChar(150), nombre_corto)
      .input('descripcion', sql.NVarChar(500), descripcion)
      .input('es_obligatorio', sql.Bit, es_obligatorio ? 1 : 0)
      .input('tipo_input', sql.VarChar(50), tipo_input)
      .input('tipo_archivo_permitido', sql.VarChar(100), tipo_archivo_permitido)
      .input('tamano_max_mb', sql.Int, tamano_max_mb != null ? Number.parseInt(tamano_max_mb, 10) : null)
      .input('orden_visual', sql.Int, orden_visual != null ? Number.parseInt(orden_visual, 10) : 1)
      .input('activo', sql.Bit, activo ? 1 : 0);

    const result = await request.execute(STORED_PROCEDURES.GUARDAR);
    return (result.recordset || []).map(FormularioRequisitoRepository.mapRecord);
  }
}

export default FormularioRequisitoRepository;
