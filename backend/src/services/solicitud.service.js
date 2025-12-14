import fs from 'node:fs/promises';
import SolicitudRepository from '../repositories/solicitud.repository.js';
import PagoRepository from '../repositories/pago.repository.js';
import RevisionCampoService from './revisionCampo.service.js';
import ArchivoRepository from '../repositories/archivo.repository.js';
import TipoTramiteRepository from '../repositories/tipoTramite.repository.sqlserver.js';
import TipoServicioRepository from '../repositories/tipoServicio.repository.sqlserver.js';
import EstadoSolicitudRepository from '../repositories/estadoSolicitud.repository.js';
import HistorialSolicitudRepository from '../repositories/historialSolicitud.repository.js';
import SustanciaRepository from '../repositories/sustancia.repository.js';
import AuditoriaRepository from '../repositories/auditoria.repository.js';
import { ApiError } from '../utils/apiError.js';
import { ESTADOS_SOLICITUD } from '../constants/estadosSolicitud.js';
import { ensureEstadosSolicitudIntegridad } from '../database/estadoConstraintManager.js';

const ESTADOS_PERMITIDOS = new Set(ESTADOS_SOLICITUD);

/**
 * Servicio de Solicitud
 */
export class SolicitudService {
  /**
   * Crear nueva solicitud
   */
  static async crearSolicitud(idSolicitante, datos, idEmpleado = null) {
    const idTipoServicio = Number(datos.id_tipo_servicio);
    let idTipoTramite = Number(datos.id_tipo_tramite);
    const nombreTramiteSeleccionado = (
      datos.nombre_tramite ||
      datos.nombreTramite ||
      datos.nombre_tramite_seleccionado ||
      datos.nombreTramiteSeleccionado ||
      datos?.datos_servicio?.estatus_tramite ||
      ''
    ).trim();

    if (!idTipoServicio) {
      throw new ApiError('Tipo de servicio no válido', 400);
    }

    if (!idTipoTramite && !nombreTramiteSeleccionado) {
      throw new ApiError('Tipo de trámite no especificado', 400);
    }

    // Validar que tipo de servicio exista
    const tipoServicio = await TipoServicioRepository.obtenerPorId(idTipoServicio);

    if (!tipoServicio) {
      throw new ApiError('Tipo de servicio no válido', 400);
    }

    // Validar que tipo de trámite exista
    let tipoTramite = await TipoTramiteRepository.obtenerPorId(idTipoTramite);

    if (!tipoTramite && nombreTramiteSeleccionado) {
      tipoTramite = await TipoTramiteRepository.obtenerPorNombre(
        nombreTramiteSeleccionado,
        idTipoServicio
      );
      if (tipoTramite) {
        idTipoTramite = tipoTramite.id_tipo_tramite;
      }
    }

    if (!tipoTramite && nombreTramiteSeleccionado) {
      tipoTramite = await TipoTramiteRepository.crear({
        id_tipo_servicio: idTipoServicio,
        nombre_tramite: nombreTramiteSeleccionado,
        descripcion: `Generado automáticamente para ${tipoServicio.nombre_servicio}`,
        requiere_costo: false,
        costo_tramite: 0,
        campos_obligatorios: null
      });
      idTipoTramite = tipoTramite.id_tipo_tramite;
    }

    if (!tipoTramite) {
      throw new ApiError('Tipo de trámite no válido', 400);
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + (tipoServicio.dias_respuesta || 30));

    // Crear solicitud
    const solicitud = await SolicitudRepository.crearSolicitud({
      id_solicitante: idSolicitante,
      id_tipo_servicio: idTipoServicio,
      id_tipo_tramite: idTipoTramite,
      fecha_vencimiento: fechaVencimiento,
      id_empleado_asignado: idEmpleado,
      numero_cidc_anterior: datos.numero_cidc_anterior || null,
      motivo_detalle: datos.motivo_detalle || null,
      datos_servicio: datos.datos_servicio || null,
      documentos_reportados: datos.documentos_reportados || null,
      resumen_pago_label: datos.resumen_pago_label || null,
      monto_total_reportado: datos.monto_total_reportado ?? null
    });

    // Si hay monto a pagar, crear registro de pago
    if ((tipoServicio.costo_administrativo || 0) > 0) {
      await PagoRepository.crearPago({
        id_solicitud: solicitud.id_solicitud,
        monto_total: tipoServicio.costo_administrativo,
        forma_pago: 'TRANSFERENCIA',
        referencia_pago: 'SOL-' + solicitud.id_solicitud
      });
    }

    // Registrar en historial
    await this.registrarCambioEstado(
      solicitud.id_solicitud,
      null,
      'CREADA',
      idEmpleado,
      'Solicitud creada por ' + (idEmpleado ? 'ventanilla' : 'solicitante en línea')
    );

    return solicitud;
  }

  /**
   * Cambiar estado de solicitud
   */
  static async cambiarEstado(idSolicitud, nuevoEstado, idEmpleado, unidad, comentario = '') {
    if (!nuevoEstado) {
      throw new ApiError('Estado no válido', 400);
    }

    const estadoNormalizado = nuevoEstado.toUpperCase();

    if (!ESTADOS_PERMITIDOS.has(estadoNormalizado)) {
      throw new ApiError('Estado no válido', 400);
    }

    await ensureEstadosSolicitudIntegridad();

    const solicitudActual = await SolicitudRepository.obtenerPorId(idSolicitud);

    if (!solicitudActual) {
      throw new ApiError('Solicitud no encontrada', 404);
    }

    const estadoAnterior = (solicitudActual.estado_solicitud || '').toUpperCase() || null;

    if (estadoAnterior === estadoNormalizado) {
      return {
        id_solicitud: idSolicitud,
        estado_solicitud: estadoNormalizado,
        cambio_registrado: false
      };
    }

    let estadoValido = await EstadoSolicitudRepository.obtenerPorNombre(estadoNormalizado);

    if (!estadoValido) {
      estadoValido = await EstadoSolicitudRepository.crearEstado({
        nombre_estado: estadoNormalizado,
        descripcion: `Estado ${estadoNormalizado}`,
        orden_secuencial: 99
      });
    }

    const resultado = await SolicitudRepository.cambiarEstado(
      idSolicitud,
      estadoNormalizado
    );

    if (!resultado?.cambioAplicado) {
      return {
        id_solicitud: idSolicitud,
        estado_solicitud: estadoAnterior || estadoNormalizado,
        cambio_registrado: false
      };
    }

    const comentarioFinal = comentario && comentario.trim().length > 0
      ? comentario
      : `Cambio automático a ${estadoNormalizado}`;

    await this.registrarCambioEstado(
      idSolicitud,
      estadoAnterior,
      estadoNormalizado,
      idEmpleado,
      comentarioFinal,
      unidad
    );

    return {
      id_solicitud: idSolicitud,
      estado_solicitud: estadoNormalizado,
      cambio_registrado: true
    };
  }

  /**
   * Registrar cambio de estado (helper)
   */
  static async registrarCambioEstado(idSolicitud, estadoOrigen, estadoDestino, idEmpleado, comentario, unidad = null) {
    await HistorialSolicitudRepository.registrarCambio({
      id_solicitud: idSolicitud,
      estado_anterior: estadoOrigen,
      estado_nuevo: estadoDestino,
      id_empleado_cambio: idEmpleado,
      motivo_cambio: comentario,
      unidad_origen: unidad
    });

    return { mensaje: 'Cambio de estado registrado' };
  }

  /**
   * Obtener detalle completo de solicitud
   */
  static async obtenerDetalleCompleto(idSolicitud) {
    const solicitud = await SolicitudRepository.obtenerPorId(idSolicitud);
    const historial = await SolicitudRepository.obtenerHistorial(idSolicitud) || [];
    const sustancias = await SolicitudRepository.obtenerSustancias(idSolicitud) || [];
    const pago = await PagoRepository.obtenerPorSolicitud(idSolicitud);
    const revisionCampos = await RevisionCampoService.listar(idSolicitud).catch(() => []);

    return {
      ...solicitud,
      historial,
      sustancias,
      pago,
      revision_campos: revisionCampos
    };
  }

  /**
   * Agregar sustancia a solicitud
   */
  static async agregarSustancia(idSolicitud, dataSustancia) {
    // Validar que la sustancia exista
    const sustancia = await SustanciaRepository.obtenerPorId(dataSustancia.id_sustancia);

    if (!sustancia) {
      throw new ApiError('Sustancia no válida', 400);
    }

    return await SolicitudRepository.agregarSustancia(idSolicitud, {
      ...dataSustancia,
      id_categoria: sustancia.id_categoria
    });
  }

  /**
   * Obtener solicitudes por estado para bandeja de trabajo
   */
  static async listarPorEstado(estado, pagina = 1, porPagina = 20, filtros = {}) {
    try {
      const result = await SolicitudRepository.listarPorEstado(estado, pagina, porPagina, filtros);
      if (!result || !Array.isArray(result)) {
        return [];
      }
      return result;
    } catch (error) {
      console.error('Error en listarPorEstado:', error);
      throw error;
    }
  }

  static async obtenerPorEstado(estado, pagina = 1, porPagina = 20, filtros = {}) {
    return this.listarPorEstado(estado, pagina, porPagina, filtros);
  }

  /**
   * Reenviar solicitud devuelta por ventanilla (solicitante)
   */
  static async reenviarCorrecciones(idSolicitud, idSolicitante, datos) {
    if (!idSolicitud || !idSolicitante) {
      throw new ApiError('Parámetros inválidos para reenviar solicitud', 400);
    }

    const solicitud = await SolicitudRepository.obtenerPorId(idSolicitud);

    if (!solicitud) {
      throw new ApiError('Solicitud no encontrada', 404);
    }

    if (solicitud.id_solicitante !== idSolicitante) {
      throw new ApiError('No tienes permiso para modificar esta solicitud', 403);
    }

    const estadoActual = (solicitud.estado_solicitud || '').toUpperCase();
    if (estadoActual !== 'DEVUELTA_VENTANILLA') {
      throw new ApiError('Solo puedes reenviar solicitudes devueltas por ventanilla', 400);
    }

    const idTipoServicio = Number(datos.id_tipo_servicio);
    const idTipoTramite = Number(datos.id_tipo_tramite);

    if (!idTipoServicio || !idTipoTramite) {
      throw new ApiError('Tipo de servicio y tipo de trámite son requeridos', 400);
    }

    await SolicitudRepository.actualizarDatosSolicitante(idSolicitud, {
      ...datos,
      id_tipo_servicio: idTipoServicio,
      id_tipo_tramite: idTipoTramite
    });

    await this.cambiarEstado(
      idSolicitud,
      'CREADA',
      null,
      null,
      datos.comentario_retorno || 'Correcciones reenviadas por solicitante'
    );

    return await this.obtenerDetalleCompleto(idSolicitud);
  }

  /**
   * Eliminar solicitud (solo ADMIN)
   */
  static async eliminarSolicitud(idSolicitud, idEmpleado, motivo = '') {
    const solicitudId = Number.parseInt(idSolicitud, 10);

    if (Number.isNaN(solicitudId)) {
      throw new ApiError('ID de solicitud inválido', 400);
    }

    const solicitud = await SolicitudRepository.obtenerPorId(solicitudId);

    if (!solicitud) {
      throw new ApiError('Solicitud no encontrada', 404);
    }

    const estadoActual = (solicitud.estado_solicitud || solicitud.estado_actual || '').toUpperCase();
    const estadosProtegidos = new Set(['APROBADA', 'RESOLUCION_EMITIDA', 'CERTIFICADO_EMITIDO', 'COMPLETADA']);

    if (estadosProtegidos.has(estadoActual)) {
      throw new ApiError('No se puede eliminar una solicitud que ya fue finalizada', 400);
    }

    const archivosAsociados = await ArchivoRepository.obtenerPorSolicitud(solicitudId).catch(() => []);
    if (archivosAsociados?.length) {
      await Promise.allSettled(archivosAsociados.map(async (archivo) => {
        if (!archivo?.ruta_almacenamiento) return;
        try {
          await fs.unlink(archivo.ruta_almacenamiento);
        } catch (error) {
          console.warn('No se pudo eliminar archivo físico', archivo.ruta_almacenamiento, error.message);
        }
      }));
    }

    await SolicitudRepository.eliminarSolicitud(solicitudId);

    const motivoAuditoria = motivo?.trim() || 'Eliminada manualmente por administrador';
    try {
      await AuditoriaRepository.registrarCambio({
        tabla_afectada: 'solicitud',
        id_registro: solicitudId,
        tipo_operacion: 'DELETE',
        valores_anteriores: JSON.stringify({
          numero_expediente: solicitud.numero_expediente,
          estado: estadoActual,
          solicitante: solicitud.id_solicitante
        }),
        valores_nuevos: JSON.stringify({ motivo: motivoAuditoria }),
        id_usuario: idEmpleado || null,
        tipo_usuario: 'EMPLEADO'
      });
    } catch (error) {
      console.warn('No se pudo registrar auditoria de eliminacion:', error.message);
    }

    return {
      id_solicitud: solicitudId,
      eliminado: true
    };
  }
}

export default SolicitudService;

