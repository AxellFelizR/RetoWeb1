import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  OBTENER_POR_ID: 'sp_sustancia_obtener_por_id'
});

export class SustanciaRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async obtenerPorId(idSustancia) {
    this.ensurePool();
    if (!idSustancia) {
      return null;
    }

    try {
      const resultado = await db.pool.request()
        .input('id_sustancia', sql.Int, Number.parseInt(idSustancia, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error obteniendo sustancia controlada:', error);
      throw error;
    }
  }
}

export default SustanciaRepository;
