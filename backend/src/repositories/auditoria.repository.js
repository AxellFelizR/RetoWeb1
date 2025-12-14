import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  REGISTRAR: 'sp_auditoria_registrar_cambio'
});

export class AuditoriaRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async registrarCambio({
    tabla_afectada,
    id_registro = null,
    tipo_operacion,
    valores_anteriores = null,
    valores_nuevos = null,
    id_usuario = null,
    tipo_usuario = null,
    ip_origen = null,
    navegador_user_agent = null
  }) {
    this.ensurePool();
    if (!tabla_afectada || !tipo_operacion) {
      throw new Error('Datos incompletos para auditoria');
    }

    try {
      await db.pool.request()
        .input('tabla_afectada', sql.VarChar(50), tabla_afectada)
        .input('id_registro', sql.Int, id_registro ? Number.parseInt(id_registro, 10) : null)
        .input('tipo_operacion', sql.VarChar(20), tipo_operacion)
        .input('valores_anteriores', sql.NVarChar(sql.MAX), valores_anteriores || null)
        .input('valores_nuevos', sql.NVarChar(sql.MAX), valores_nuevos || null)
        .input('id_usuario', sql.Int, id_usuario ? Number.parseInt(id_usuario, 10) : null)
        .input('tipo_usuario', sql.VarChar(20), tipo_usuario || null)
        .input('ip_origen', sql.VarChar(45), ip_origen || null)
        .input('navegador_user_agent', sql.VarChar(500), navegador_user_agent || null)
        .execute(STORED_PROCEDURES.REGISTRAR);

      return { registrado: true };
    } catch (error) {
      console.error('Error registrando auditoria:', error);
      throw error;
    }
  }
}

export default AuditoriaRepository;
