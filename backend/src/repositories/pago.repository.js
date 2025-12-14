import sql from 'mssql';
import db from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  CREAR: 'sp_pago_crear',
  OBTENER_POR_SOLICITUD: 'sp_pago_obtener_por_solicitud',
  OBTENER_POR_ID: 'sp_pago_obtener_por_id',
  ACTUALIZAR_ESTADO: 'sp_pago_actualizar_estado',
  LISTAR_PENDIENTES: 'sp_pago_listar_pendientes'
});

export class PagoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static mapPagoRecord(record) {
    if (!record) {
      return null;
    }

    return {
      ...record,
      fecha_creacion: record.fecha_creacion || null,
      fecha_confirmacion: record.fecha_confirmacion || null,
      fecha_vencimiento: record.fecha_vencimiento || null
    };
  }

  static buildPagoPayload(datos) {
    return {
      id_solicitud: Number.parseInt(datos.id_solicitud, 10),
      monto_total: Number(datos.monto_total ?? datos.monto ?? 0),
      forma_pago: datos.forma_pago || datos.metodo_pago || 'TRANSFERENCIA',
      referencia_pago: datos.referencia_pago || datos.numero_recibo || datos.referencia || '',
      monto_costo_administrativo: Number(datos.monto_costo_administrativo ?? 0),
      monto_tramite: Number(datos.monto_tramite ?? 0)
    };
  }

  static async crearPago(datos) {
    this.ensurePool();
    const payload = this.buildPagoPayload(datos);

    if (!payload.id_solicitud || Number.isNaN(payload.monto_total)) {
      throw new Error('Datos inválidos para crear pago');
    }

    try {
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, payload.id_solicitud)
        .input('monto_total', sql.Decimal(18, 2), payload.monto_total)
        .input('forma_pago', sql.VarChar(50), payload.forma_pago)
        .input('referencia_pago', sql.VarChar(100), payload.referencia_pago)
        .input('monto_costo_administrativo', sql.Decimal(18, 2), payload.monto_costo_administrativo)
        .input('monto_tramite', sql.Decimal(18, 2), payload.monto_tramite)
        .execute(STORED_PROCEDURES.CREAR);

      return {
        id_pago: result.recordset?.[0]?.id_pago,
        ...payload,
        estado_pago: 'PENDIENTE'
      };
    } catch (error) {
      console.error('Error creando pago:', error);
      throw error;
    }
  }

  static async obtenerPorSolicitud(idSolicitud) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, Number.parseInt(idSolicitud, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_SOLICITUD);

      return this.mapPagoRecord(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo pago por solicitud:', error);
      throw error;
    }
  }

  static async obtenerPorId(idPago) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_pago', sql.Int, Number.parseInt(idPago, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);

      return this.mapPagoRecord(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo pago por ID:', error);
      throw error;
    }
  }

  static async actualizarEstado(idPago, nuevoEstado, numeroComprobante = null) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_pago', sql.Int, Number.parseInt(idPago, 10))
        .input('estado_pago', sql.VarChar(20), nuevoEstado)
        .input('numero_comprobante', sql.VarChar(50), numeroComprobante)
        .execute(STORED_PROCEDURES.ACTUALIZAR_ESTADO);

      return result.recordset?.[0] || { id_pago: Number.parseInt(idPago, 10), estado_pago: nuevoEstado };
    } catch (error) {
      console.error('Error actualizando estado de pago:', error);
      throw error;
    }
  }

  static async listarPendientes() {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .execute(STORED_PROCEDURES.LISTAR_PENDIENTES);

      return result.recordset || [];
    } catch (error) {
      console.error('Error listando pagos pendientes:', error);
      throw error;
    }
  }
}

export default PagoRepository;
