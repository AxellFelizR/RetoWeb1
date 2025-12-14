import SolicitudService from '../services/solicitud.service.js';
import RevisionCampoService from '../services/revisionCampo.service.js';
import ArchivoRepository from '../repositories/archivo.repository.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Controlador de Solicitudes
 */
export class SolicitudController {
  /**
   * POST /api/solicitudes
   * Crear nueva solicitud
   */
  static async crearSolicitud(req, res, next) {
    try {
      const {
        id_tipo_servicio,
        id_tipo_tramite,
        numero_cidc_anterior,
        motivo_detalle,
        datos_servicio,
        datosServicio,
        documentos_reportados,
        documentosReportados,
        resumen_pago_label,
        resumenPagoLabel,
        monto_total_reportado,
        montoTotalReportado
      } = req.body;
      const idSolicitante = req.user.id_solicitante;

      if (!id_tipo_servicio) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de servicio es requerido'
        });
      }

      if (!id_tipo_tramite) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de trámite es requerido'
        });
      }

      const solicitud = await SolicitudService.crearSolicitud(idSolicitante, {
        id_tipo_servicio,
        id_tipo_tramite,
        numero_cidc_anterior,
        motivo_detalle,
        datos_servicio: datos_servicio ?? datosServicio ?? null,
        documentos_reportados: documentos_reportados ?? documentosReportados ?? null,
        resumen_pago_label: resumen_pago_label ?? resumenPagoLabel ?? null,
        monto_total_reportado: monto_total_reportado ?? montoTotalReportado ?? null
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente',
        data: solicitud
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/:id
   * Obtener detalle de solicitud
   */
  static async obtenerDetalle(req, res, next) {
    try {
      const { id } = req.params;
      const idSolicitud = Number.parseInt(id, 10);

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      const solicitud = await SolicitudService.obtenerDetalleCompleto(idSolicitud);

      if (!solicitud) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud no encontrada'
        });
      }

      res.json({
        success: true,
        data: solicitud
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/:id/revision-campos
   * Obtener revisión de campos para empleados
   */
  static async obtenerRevisionCampos(req, res, next) {
    try {
      const { id } = req.params;
      const idSolicitud = Number.parseInt(id, 10);

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      const revision = await RevisionCampoService.listar(idSolicitud);

      res.json({
        success: true,
        data: revision
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/solicitudes/:id/revision-campos
   * Guardar resultado de revisión de campos
   */
  static async guardarRevisionCampos(req, res, next) {
    try {
      const { id } = req.params;
      const { campos } = req.body;
      const idSolicitud = Number.parseInt(id, 10);
      const idEmpleado = req.user.id_empleado;

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      const resultado = await RevisionCampoService.guardarResultados(
        idSolicitud,
        campos,
        idEmpleado
      );

      res.json({
        success: true,
        message: 'Revisión actualizada',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes
   * Listar solicitudes del solicitante
   */
  static async listarDelSolicitante(req, res, next) {
    try {
      const idSolicitante = req.user.id_solicitante;

      if (!idSolicitante) {
        console.error('ERROR: id_solicitante no encontrado en req.user:', req.user);
        throw new ApiError('No autorizado - ID solicitante no encontrado', 401);
      }

      const { pagina = 1, porPagina = 10 } = req.query;

      const solicitudes = await SolicitudService.obtenerPorEstado(
        null,
        Number.parseInt(pagina, 10),
        Number.parseInt(porPagina, 10),
        { id_solicitante: idSolicitante }
      );

      res.json({
        success: true,
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/admin/auditoria
   * Listar todas las solicitudes para auditoría (ADMIN)
   */
  static async listarAuditoria(req, res, next) {
    try {
      const { estado = null, pagina = 1, porPagina = 25, idSolicitante = null } = req.query;

      const paginaNumber = Number.parseInt(pagina, 10) || 1;
      const porPaginaNumber = Number.parseInt(porPagina, 10) || 25;

      const filtros = {};
      if (idSolicitante) {
        const solicitanteIdNumber = Number.parseInt(idSolicitante, 10);
        if (!Number.isNaN(solicitanteIdNumber)) {
          filtros.id_solicitante = solicitanteIdNumber;
        }
      }

      const solicitudes = await SolicitudService.listarPorEstado(
        estado && estado !== 'TODAS' ? estado : null,
        paginaNumber,
        porPaginaNumber,
        filtros
      );

      res.json({
        success: true,
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/estado/:estado
   * Listar solicitudes para bandejas internas por estado
   */
  static async listarPorEstado(req, res, next) {
    try {
      const { estado } = req.params;
      const { pagina = 1, porPagina = 20, id_solicitante: idSolicitante = null } = req.query;

      const paginaNumber = Number.parseInt(pagina, 10) || 1;
      const porPaginaNumber = Number.parseInt(porPagina, 10) || 20;

      const filtros = {};
      if (idSolicitante) {
        const solicitanteIdNumber = Number.parseInt(idSolicitante, 10);
        if (!Number.isNaN(solicitanteIdNumber)) {
          filtros.id_solicitante = solicitanteIdNumber;
        }
      }

      const estadoNormalizado = estado && estado.toUpperCase() !== 'TODAS'
        ? estado.toUpperCase()
        : null;

      const solicitudes = await SolicitudService.listarPorEstado(
        estadoNormalizado,
        paginaNumber,
        porPaginaNumber,
        filtros
      );

      res.json({
        success: true,
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/solicitudes/:id/estado
   * Cambiar estado de solicitud
   */
  static async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { nuevoEstado, comentario } = req.body;
      const idEmpleado = req.user.id_empleado;

      if (!nuevoEstado) {
        return res.status(400).json({
          success: false,
          message: 'El nuevo estado es requerido'
        });
      }

      const resultado = await SolicitudService.cambiarEstado(
        id,
        nuevoEstado,
        idEmpleado,
        req.user.departamento,
        comentario
      );

      res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/solicitudes/:id/reenviar
   * Reenviar correcciones desde el solicitante
   */
  static async reenviarCorrecciones(req, res, next) {
    try {
      const { id } = req.params;
      const idSolicitud = Number.parseInt(id, 10);
      const idSolicitante = req.user.id_solicitante;

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      if (!idSolicitante) {
        throw new ApiError('No autorizado', 401);
      }

      const resultado = await SolicitudService.reenviarCorrecciones(
        idSolicitud,
        idSolicitante,
        req.body
      );

      res.json({
        success: true,
        message: 'Solicitud reenviada a ventanilla',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/solicitudes/:id/sustancias
   * Agregar sustancia a solicitud
   */
  static async agregarSustancia(req, res, next) {
    try {
      const { id } = req.params;
      const { id_sustancia, cantidad, unidad_medida } = req.body;

      if (!id_sustancia || !cantidad) {
        return res.status(400).json({
          success: false,
          message: 'Sustancia y cantidad son requeridas'
        });
      }

      const resultado = await SolicitudService.agregarSustancia(id, {
        id_sustancia,
        cantidad,
        unidad_medida: unidad_medida || 'KG'
      });

      res.json({
        success: true,
        message: 'Sustancia agregada exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/solicitudes/:id/archivos
   * Subir archivo a solicitud
   */
  static async subirArchivo(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Archivo es requerido'
        });
      }

      const archivo = await ArchivoRepository.crearArchivo({
        id_solicitud: id,
        nombre_archivo: req.file.originalname,
        tipo_archivo: req.file.mimetype,
        tamano_bytes: req.file.size,
        ruta_almacenamiento: req.file.path,
        mime_type: req.file.mimetype
      });

      res.status(201).json({
        success: true,
        message: 'Archivo subido exitosamente',
        data: archivo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/:id/archivos
   * Obtener archivos de solicitud
   */
  static async obtenerArchivos(req, res, next) {
    try {
      const { id } = req.params;

      const archivos = await ArchivoRepository.obtenerPorSolicitud(id);

      res.json({
        success: true,
        data: archivos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/solicitudes/:id/archivos/:idArchivo
   * Eliminar archivo
   */
  static async eliminarArchivo(req, res, next) {
    try {
      const { idArchivo } = req.params;

      await ArchivoRepository.eliminarArchivo(idArchivo);

      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/solicitudes/:id
   * Eliminar solicitud completa (ADMIN)
   */
  static async eliminarSolicitud(req, res, next) {
    try {
      const { id } = req.params;
      const { motivo } = req.body || {};
      const idSolicitud = Number.parseInt(id, 10);

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      const resultado = await SolicitudService.eliminarSolicitud(
        idSolicitud,
        req.user?.id_empleado || null,
        motivo
      );

      res.json({
        success: true,
        message: 'Solicitud eliminada permanentemente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/solicitudes/:id/historial
   * Obtener historial de cambios
   */
  static async obtenerHistorial(req, res, next) {
    try {
      const { id } = req.params;
      const idSolicitud = Number.parseInt(id, 10);

      if (Number.isNaN(idSolicitud)) {
        return res.status(400).json({
          success: false,
          message: 'ID de solicitud inválido'
        });
      }

      const solicitud = await SolicitudService.obtenerDetalleCompleto(idSolicitud);
      const historial = solicitud?.historial || [];

      res.json({
        success: true,
        data: historial
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SolicitudController;

