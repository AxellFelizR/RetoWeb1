import PagoService from '../services/pago.service.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Controlador de Pagos
 */
export class PagoController {
  /**
   * Crear pago
   */
  static async crearPago(req, res, next) {
    try {
      const { id_solicitud, monto, concepto, referencia_pago, metodo_pago } = req.body;

      // Validar datos requeridos
      if (!id_solicitud || !monto || !concepto) {
        throw new ApiError('Faltan datos requeridos (id_solicitud, monto, concepto)', 400);
      }

      if (monto <= 0) {
        throw new ApiError('El monto debe ser mayor a 0', 400);
      }

      const resultado = await PagoService.crearPago({
        id_solicitud,
        monto,
        concepto,
        referencia_pago,
        metodo_pago
      });

      res.status(201).json({
        success: true,
        message: 'Pago creado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pago por ID
   */
  static async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;

      const pago = await PagoService.obtenerPorId(parseInt(id));

      if (!pago) {
        throw new ApiError('Pago no encontrado', 404);
      }

      res.status(200).json({
        success: true,
        data: pago
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pagos por solicitud
   */
  static async obtenerPorSolicitud(req, res, next) {
    try {
      const { id_solicitud } = req.params;

      const pagos = await PagoService.obtenerPorSolicitud(parseInt(id_solicitud));

      res.status(200).json({
        success: true,
        total: pagos.length,
        data: pagos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar pagos con filtros
   */
  static async listar(req, res, next) {
    try {
      const filtros = {
        estado_pago: req.query.estado_pago,
        metodo_pago: req.query.metodo_pago,
        fechaDesde: req.query.fechaDesde,
        fechaHasta: req.query.fechaHasta
      };

      const pagos = await PagoService.listar(filtros);

      res.status(200).json({
        success: true,
        total: pagos.length,
        data: pagos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar estado del pago
   */
  static async actualizarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { estado_pago } = req.body;

      if (!estado_pago) {
        throw new ApiError('Estado de pago es requerido', 400);
      }

      const resultado = await PagoService.actualizarEstado(parseInt(id), estado_pago);

      if (!resultado) {
        throw new ApiError('Pago no encontrado', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Estado de pago actualizado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener resumen de pagos
   */
  static async obtenerResumen(req, res, next) {
    try {
      const resumen = await PagoService.obtenerResumen();

      res.status(200).json({
        success: true,
        data: resumen
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pagos pendientes
   */
  static async listarPendientes(req, res, next) {
    try {
      const pagos = await PagoService.listarPendientes();

      res.status(200).json({
        success: true,
        total: pagos.length,
        data: pagos
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PagoController;
