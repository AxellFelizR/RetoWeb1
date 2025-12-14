import sql from 'mssql';
import { db } from '../database/db.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Servicio de Pagos
 */
export class PagoService {
  /**
   * Crear pago
   */
  static async crearPago(datos) {
    try {
      const {
        id_solicitud,
        monto_total,
        forma_pago = 'TRANSFERENCIA',
        referencia_pago,
        monto_costo_administrativo = 0,
        monto_tramite = 0
      } = datos;

      // Validar solicitud existe
      const solicitudResult = await db.pool.request()
        .input('id_solicitud', sql.Int, id_solicitud)
        .query('SELECT id_solicitud FROM solicitud WHERE id_solicitud = @id_solicitud');

      if (solicitudResult.recordset.length === 0) {
        throw new ApiError('Solicitud no encontrada', 404);
      }

      // Crear pago
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, id_solicitud)
        .input('monto_total', sql.Decimal(10, 2), monto_total)
        .input('monto_costo_administrativo', sql.Decimal(10, 2), monto_costo_administrativo)
        .input('monto_tramite', sql.Decimal(10, 2), monto_tramite)
        .input('forma_pago', sql.VarChar(50), forma_pago)
        .input('referencia_pago', sql.VarChar(100), referencia_pago || '')
        .query(`
          INSERT INTO pago 
          (id_solicitud, monto_total, monto_costo_administrativo, monto_tramite, forma_pago, referencia_pago, estado_pago, fecha_vencimiento)
          VALUES 
          (@id_solicitud, @monto_total, @monto_costo_administrativo, @monto_tramite, @forma_pago, @referencia_pago, 'PENDIENTE', DATEADD(day, 5, GETDATE()))
          SELECT SCOPE_IDENTITY() as id_pago
        `);

      return {
        id_pago: result.recordset[0].id_pago,
        id_solicitud,
        monto_total,
        forma_pago,
        estado_pago: 'PENDIENTE'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener pago por ID
   */
  static async obtenerPorId(id) {
    try {
      const result = await db.pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            id_pago,
            id_solicitud,
            monto_total,
            referencia_pago,
            forma_pago,
            estado_pago,
            fecha_creacion,
            fecha_confirmacion
          FROM pago WHERE id_pago = @id
        `);

      return result.recordset[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener pagos por solicitud
   */
  static async obtenerPorSolicitud(idSolicitud) {
    try {
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, idSolicitud)
        .query(`
          SELECT 
            id_pago,
            id_solicitud,
            monto_total,
            referencia_pago,
            forma_pago,
            estado_pago,
            fecha_creacion,
            fecha_confirmacion
          FROM pago 
          WHERE id_solicitud = @id_solicitud
          ORDER BY fecha_creacion DESC
        `);

      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar pagos con filtros
   */
  static async listar(filtros = {}) {
    try {
      let query = 'SELECT id_pago, id_solicitud, monto_total, referencia_pago, forma_pago, estado_pago, fecha_creacion, fecha_confirmacion FROM pago WHERE 1=1';
      const request = db.pool.request();

      if (filtros.estado_pago) {
        request.input('estado_pago', sql.VarChar(20), filtros.estado_pago);
        query += ' AND estado_pago = @estado_pago';
      }

      if (filtros.forma_pago) {
        request.input('forma_pago', sql.VarChar(50), filtros.forma_pago);
        query += ' AND forma_pago = @forma_pago';
      }

      if (filtros.fechaDesde) {
        request.input('fechaDesde', sql.DateTime, filtros.fechaDesde);
        query += ' AND fecha_creacion >= @fechaDesde';
      }

      if (filtros.fechaHasta) {
        request.input('fechaHasta', sql.DateTime, filtros.fechaHasta);
        query += ' AND fecha_creacion <= @fechaHasta';
      }

      query += ' ORDER BY fecha_creacion DESC';

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar estado del pago
   */
  static async actualizarEstado(id, nuevoEstado) {
    try {
      const estadosValidos = ['PENDIENTE', 'PAGADO', 'CANCELADO'];

      if (!estadosValidos.includes(nuevoEstado)) {
        throw new ApiError('Estado de pago inválido', 400);
      }

      const query = nuevoEstado === 'PAGADO'
        ? `UPDATE pago SET estado_pago = @estado, fecha_confirmacion = GETDATE() WHERE id_pago = @id`
        : `UPDATE pago SET estado_pago = @estado WHERE id_pago = @id`;

      await db.pool.request()
        .input('id', sql.Int, id)
        .input('estado', sql.VarChar(20), nuevoEstado)
        .query(query);

      return await this.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener resumen de pagos por estado
   */
  static async obtenerResumen() {
    try {
      const result = await db.pool.request()
        .query(`
          SELECT 
            estado_pago,
            COUNT(*) as total_pagos,
            SUM(monto) as monto_total
          FROM pago
          GROUP BY estado_pago
        `);

      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener pagos pendientes
   */
  static async listarPendientes() {
    try {
      const result = await db.pool.request()
        .query(`
          SELECT 
            id_pago,
            id_solicitud,
            monto,
            concepto,
            referencia_pago,
            metodo_pago,
            fecha_creacion
          FROM pago 
          WHERE estado_pago = 'PENDIENTE'
          ORDER BY fecha_creacion ASC
        `);

      return result.recordset;
    } catch (error) {
      throw error;
    }
  }
}

export default PagoService;
