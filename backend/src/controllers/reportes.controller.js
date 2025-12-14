import sql from 'mssql';
import { db } from '../database/db.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Controlador de Reportes
 */
export class ReportesController {
  /**
   * Reporte de solicitudes por estado
   */
  static async reportePorEstado(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_solicitudes_por_estado');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Solicitudes por Estado',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de solicitudes por mes
   */
  static async reportePorMes(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_solicitudes_por_mes');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Solicitudes por Mes',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de solicitudes por solicitante
   */
  static async reportePorSolicitante(req, res, next) {
    try {
      const { id_solicitante } = req.query;
      const request = db.pool.request();

      if (id_solicitante) {
        request.input('id_solicitante', sql.Int, Number.parseInt(id_solicitante, 10));
      }

      const result = await request.execute('sp_reporte_solicitudes_por_solicitante');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Solicitudes por Solicitante',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de sustancias solicitadas
   */
  static async reporteSustancias(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_sustancias_solicitadas');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Sustancias Solicitadas',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de pagos
   */
  static async reportePagos(req, res, next) {
    try {
      const { estado } = req.query;

      const request = db.pool.request();

      if (estado) {
        request.input('estado', sql.VarChar(20), estado);
      }

      const result = await request.execute('sp_reporte_pagos');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Pagos',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de archivos
   */
  static async reporteArchivos(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_archivos');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Archivos',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte general del sistema
   */
  static async reporteGeneral(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_general');

      const payload = result.recordset?.[0] || {};

      res.status(200).json({
        success: true,
        titulo: 'Reporte General del Sistema',
        data: {
          total_solicitudes: payload.total_solicitudes ?? 0,
          empleados_activos: payload.empleados_activos ?? 0,
          total_solicitantes: payload.total_solicitantes ?? 0,
          monto_pagado: payload.monto_pagado ?? 0,
          total_archivos: payload.total_archivos ?? 0,
          fecha_reporte: payload.fecha_reporte
            ? new Date(payload.fecha_reporte).toISOString()
            : new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reporte de actividad por empleado
   */
  static async reporteActividadEmpleado(req, res, next) {
    try {
      const result = await db.pool
        .request()
        .execute('sp_reporte_actividad_empleado');

      res.status(200).json({
        success: true,
        titulo: 'Reporte de Actividad por Empleado',
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReportesController;
