import { ApiError } from '../utils/apiError.js';
import RevisionCampoRepository from '../repositories/revisionCampo.repository.sqlserver.js';

const ESTADOS_VALIDOS = new Set(['PENDIENTE', 'CUMPLE', 'OBSERVADO']);

export class RevisionCampoService {
  static async listar(idSolicitud) {
    if (!idSolicitud) {
      throw new ApiError('idSolicitud es requerido', 400);
    }
    return RevisionCampoRepository.listarPorSolicitud(idSolicitud);
  }

  static async guardarResultados(idSolicitud, campos, idEmpleado) {
    if (!idSolicitud) {
      throw new ApiError('idSolicitud es requerido', 400);
    }

    if (!Array.isArray(campos) || campos.length === 0) {
      throw new ApiError('Debe enviar los campos a revisar', 400);
    }

    for (const campo of campos) {
      const estadoNormalizado = (campo.estado_campo || campo.estado || '').toUpperCase();
      if (!ESTADOS_VALIDOS.has(estadoNormalizado)) {
        throw new ApiError(`Estado de campo no válido: ${campo.estado_campo}`, 400);
      }

      if (estadoNormalizado === 'OBSERVADO') {
        const comentario = (campo.comentario_revision ?? campo.comentario ?? '').trim();
        if (!comentario) {
          const identificador = campo.etiqueta_campo || campo.nombre_campo || campo.nombre || 'el campo seleccionado';
          throw new ApiError(`Debes explicar la observación para ${identificador}.`, 400);
        }
      }
    }

    return RevisionCampoRepository.guardarResultados(idSolicitud, campos, idEmpleado);
  }
}

export default RevisionCampoService;
