import SolicitudService from '../services/solicitud.service.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Controlador de Bandeja de Trabajo
 * Gestiona el flujo de solicitudes según roles
 */
export class BandejaController {
  /**
   * VENTANILLA: Obtener solicitudes registradas (estado REGISTRADA)
   */
  static async obtenerSolicitudesVentanilla(req, res, next) {
    try {
      const solicitudes = await SolicitudService.listarPorEstado('REGISTRADA');

      res.status(200).json({
        success: true,
        total: solicitudes.length,
        bandeja: 'VENTANILLA',
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * VENTANILLA: Validar solicitud - cambiar estado a VALIDADA
   */
  static async validarSolicitudVentanilla(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { comentario } = req.body;

      if (!id_solicitud) {
        throw new ApiError('id_solicitud es requerido', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'VALIDADA',
        {
          comentario: comentario || 'Validado en ventanilla',
          id_empleado: req.user.id_empleado
        }
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud validada exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * VENTANILLA: Rechazar solicitud en ventanilla
   */
  static async rechazarSolicitudVentanilla(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { motivo } = req.body;

      if (!id_solicitud || !motivo) {
        throw new ApiError('id_solicitud y motivo son requeridos', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'RECHAZADA',
        {
          comentario: `Rechazado en ventanilla: ${motivo}`,
          id_empleado: req.user.id_empleado
        }
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud rechazada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPC: Obtener solicitudes validadas (estado VALIDADA)
   */
  static async obtenerSolicitudesUPC(req, res, next) {
    try {
      const solicitudes = await SolicitudService.listarPorEstado('VALIDADA');

      res.status(200).json({
        success: true,
        total: solicitudes.length,
        bandeja: 'UPC',
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPC: Revisar y aprobar solicitud - cambiar estado a EN_REVISION_UPC
   */
  static async revisarSolicitudUPC(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { comentario } = req.body;

      if (!id_solicitud) {
        throw new ApiError('id_solicitud es requerido', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'EN_REVISION_UPC',
        {
          comentario: comentario || 'En revisión UPC',
          id_empleado: req.user.id_empleado
        }
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud enviada a revisión UPC',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DIRECCIÓN: Obtener solicitudes en revisión UPC
   */
  static async obtenerSolicitudesDireccion(req, res, next) {
    try {
      const solicitudes = await SolicitudService.listarPorEstado('EN_DIRECCION');

      res.status(200).json({
        success: true,
        total: solicitudes.length,
        bandeja: 'DIRECCIÓN',
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DIRECCIÓN: Aprobar solicitud - cambiar estado a APROBADA
   */
  static async aprobarSolicitudDireccion(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { comentario } = req.body;

      if (!id_solicitud) {
        throw new ApiError('id_solicitud es requerido', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'APROBADA',
        {
          comentario: comentario || 'Aprobado por Dirección',
          id_empleado: req.user.id_empleado
        }
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud aprobada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DIRECCIÓN: Rechazar solicitud en dirección
   */
  static async rechazarSolicitudDireccion(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { motivo } = req.body;

      if (!id_solicitud || !motivo) {
        throw new ApiError('id_solicitud y motivo son requeridos', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'RECHAZADA',
        {
          comentario: `Rechazado por Dirección: ${motivo}`,
          id_empleado: req.user.id_empleado
        }
      );

      res.status(200).json({
        success: true,
        message: 'Solicitud rechazada por Dirección',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DNCD: Obtener solicitudes aprobadas
   */
  static async obtenerSolicitudesDNCD(req, res, next) {
    try {
      const solicitudes = await SolicitudService.listarPorEstado('APROBADA');

      res.status(200).json({
        success: true,
        total: solicitudes.length,
        bandeja: 'DNCD',
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DNCD: Emitir resolución y cambiar estado a RESOLUCION_EMITIDA
   */
  static async emitirResolucionDNCD(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { num_resolucion, fecha_resolucion } = req.body;

      if (!id_solicitud || !num_resolucion) {
        throw new ApiError('id_solicitud y num_resolucion son requeridos', 400);
      }

      const resultado = await SolicitudService.cambiarEstado(
        parseInt(id_solicitud),
        'RESOLUCION_EMITIDA',
        {
          comentario: `Resolución DNCD #${num_resolucion}`,
          id_empleado: req.user.id_empleado,
          num_resolucion,
          fecha_resolucion: fecha_resolucion || new Date().toISOString()
        }
      );

      res.status(200).json({
        success: true,
        message: 'Resolución emitida exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DNCD: Generar certificado
   */
  static async generarCertificadoDNCD(req, res, next) {
    try {
      const { id_solicitud } = req.params;

      if (!id_solicitud) {
        throw new ApiError('id_solicitud es requerido', 400);
      }

      // Aquí se implementaría generación de certificado PDF
      const resultado = {
        id_solicitud: parseInt(id_solicitud),
        certificado: 'En proceso',
        estado: 'GENERANDO'
      };

      res.status(200).json({
        success: true,
        message: 'Generando certificado...',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener resumen de bandeja (estadísticas)
   */
  static async obtenerResumenBandeja(req, res, next) {
    try {
      const resumen = {
        REGISTRADA: 0,
        VALIDADA: 0,
        EN_REVISION_UPC: 0,
        APROBADA: 0,
        RESOLUCION_EMITIDA: 0,
        RECHAZADA: 0,
        COMPLETADA: 0
      };

      // Obtener conteos para cada estado
      for (const estado of Object.keys(resumen)) {
        try {
          const solicitudes = await SolicitudService.listarPorEstado(estado);
          resumen[estado] = solicitudes.length;
        } catch (error) {
          console.error(`Error obteniendo ${estado}:`, error);
        }
      }

      res.status(200).json({
        success: true,
        data: resumen
      });
    } catch (error) {
      next(error);
    }
  }
}

export default BandejaController;
