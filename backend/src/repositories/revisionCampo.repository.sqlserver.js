import sql from 'mssql';
import db from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  LISTAR: 'sp_revision_campo_listar_por_solicitud',
  GUARDAR: 'sp_revision_campo_guardar'
});

export class RevisionCampoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static mapRecord(record) {
    if (!record) {
      return null;
    }

    return {
      ...record,
      fecha_revision: record.fecha_revision || null
    };
  }

  static normalizeCampoPayload(campo = {}) {
    const nombreCampo = (campo.nombre_campo || campo.nombre || '').trim().slice(0, 100);
    const etiquetaCampo = (campo.etiqueta_campo || campo.etiqueta || nombreCampo).trim().slice(0, 255);
    const estadoCampo = (campo.estado_campo || campo.estado || 'PENDIENTE').toUpperCase();
    const valorReportado = campo.valor_reportado ?? campo.valor ?? null;
    const comentarioRaw = campo.comentario_revision ?? campo.comentario ?? null;
    const comentario = comentarioRaw ? String(comentarioRaw).trim() : null;
    const valorSerializado = typeof valorReportado === 'object' && valorReportado !== null
      ? JSON.stringify(valorReportado)
      : valorReportado;

    return {
      nombreCampo,
      etiquetaCampo,
      estadoCampo,
      valorSerializado,
      comentario
    };
  }

  static async listarPorSolicitud(idSolicitud) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.LISTAR);

      return (result.recordset || []).map(this.mapRecord);
    } catch (error) {
      console.error('Error listando revisión de campos:', error);
      throw error;
    }
  }

  static async guardarResultados(idSolicitud, campos, idEmpleado) {
    this.ensurePool();

    if (!Array.isArray(campos) || campos.length === 0) {
      return [];
    }

    const resultados = [];

    for (const campo of campos) {
      const payload = this.normalizeCampoPayload(campo);

      if (!payload.nombreCampo) {
        continue;
      }

      try {
        const result = await db.pool.request()
          .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
          .input('nombre_campo', sql.VarChar(100), payload.nombreCampo)
          .input('etiqueta_campo', sql.VarChar(255), payload.etiquetaCampo)
          .input('valor_reportado', sql.NVarChar(sql.MAX), payload.valorSerializado)
          .input('estado_campo', sql.VarChar(20), payload.estadoCampo)
          .input('comentario_revision', sql.NVarChar(sql.MAX), payload.comentario)
          .input('id_empleado_revision', sql.Int, idEmpleado ? Number.parseInt(idEmpleado, 10) : null)
          .execute(STORED_PROCEDURES.GUARDAR);

        resultados.push(this.mapRecord(result.recordset?.[0] || {
          nombre_campo: payload.nombreCampo,
          etiqueta_campo: payload.etiquetaCampo,
          estado_campo: payload.estadoCampo,
          comentario_revision: payload.comentario,
          valor_reportado: payload.valorSerializado
        }));
      } catch (error) {
        console.error('Error guardando revisión de campo:', payload.nombreCampo, error);
        throw error;
      }
    }

    return resultados;
  }
}

export default RevisionCampoRepository;
