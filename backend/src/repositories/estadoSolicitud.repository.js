import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  OBTENER_POR_NOMBRE: 'sp_estado_solicitud_obtener_por_nombre',
  CREAR: 'sp_estado_solicitud_crear'
});

export class EstadoSolicitudRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async obtenerPorNombre(nombreEstado) {
    this.ensurePool();
    if (!nombreEstado) {
      return null;
    }

    try {
      const resultado = await db.pool.request()
        .input('nombre_estado', sql.VarChar(50), nombreEstado)
        .execute(STORED_PROCEDURES.OBTENER_POR_NOMBRE);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error obteniendo estado de solicitud:', error);
      throw error;
    }
  }

  static async crearEstado({
    nombre_estado,
    descripcion,
    orden_secuencial = 99,
    es_estado_inicial = 0,
    es_estado_final = 0
  }) {
    this.ensurePool();
    if (!nombre_estado) {
      throw new Error('nombre_estado requerido');
    }

    try {
      const resultado = await db.pool.request()
        .input('nombre_estado', sql.VarChar(50), nombre_estado)
        .input('descripcion', sql.NVarChar(255), descripcion || `Estado ${nombre_estado}`)
        .input('orden_secuencial', sql.Int, orden_secuencial)
        .input('es_estado_inicial', sql.Bit, es_estado_inicial ? 1 : 0)
        .input('es_estado_final', sql.Bit, es_estado_final ? 1 : 0)
        .execute(STORED_PROCEDURES.CREAR);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error creando estado de solicitud:', error);
      throw error;
    }
  }
}

export default EstadoSolicitudRepository;
