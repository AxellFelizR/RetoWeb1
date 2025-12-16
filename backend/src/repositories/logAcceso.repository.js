import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  REGISTRAR: 'sp_log_acceso_registrar'
});

export class LogAccesoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async registrar({
    tipo_acceso,
    tipo_usuario,
    id_usuario = null,
    email_usuario = null,
    resultado = 'EXITOSO',
    motivo_fallo = null,
    ip_origen = null,
    navegador_user_agent = null
  }) {
    this.ensurePool();

    if (!tipo_acceso || !tipo_usuario) {
      throw new Error('Datos incompletos para log de acceso');
    }

    if (tipo_usuario !== 'EMPLEADO') {
      throw new Error('log_acceso_sistema solo permite registros de empleados');
    }

    await db.pool.request()
      .input('tipo_acceso', sql.VarChar(50), tipo_acceso)
      .input('tipo_usuario', sql.VarChar(20), tipo_usuario)
      .input('id_usuario', sql.Int, id_usuario ? Number.parseInt(id_usuario, 10) : null)
      .input('email_usuario', sql.VarChar(255), email_usuario || null)
      .input('resultado', sql.VarChar(20), resultado || 'EXITOSO')
      .input('motivo_fallo', sql.VarChar(500), motivo_fallo || null)
      .input('ip_origen', sql.VarChar(45), ip_origen || null)
      .input('navegador_user_agent', sql.VarChar(500), navegador_user_agent || null)
      .execute(STORED_PROCEDURES.REGISTRAR);

    return { registrado: true };
  }
}

export default LogAccesoRepository;
