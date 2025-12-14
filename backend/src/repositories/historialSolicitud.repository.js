import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  REGISTRAR: 'sp_historial_estado_registrar'
});

export class HistorialSolicitudRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async registrarCambio({
    id_solicitud,
    estado_anterior = null,
    estado_nuevo,
    id_empleado_cambio = null,
    motivo_cambio = null,
    unidad_origen = null
  }) {
    this.ensurePool();
    if (!id_solicitud || !estado_nuevo) {
      throw new Error('Datos incompletos para registrar historial');
    }

    try {
      await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(id_solicitud, 10))
        .input('estado_anterior', sql.VarChar(50), estado_anterior || null)
        .input('estado_nuevo', sql.VarChar(50), estado_nuevo)
        .input('id_empleado_cambio', sql.Int, id_empleado_cambio ? Number.parseInt(id_empleado_cambio, 10) : null)
        .input('motivo_cambio', sql.NVarChar(sql.MAX), motivo_cambio || null)
        .input('unidad_origen', sql.VarChar(100), unidad_origen || null)
        .execute(STORED_PROCEDURES.REGISTRAR);

      return { registrado: true };
    } catch (error) {
      console.error('Error registrando historial de solicitud:', error);
      throw error;
    }
  }
}

export default HistorialSolicitudRepository;
