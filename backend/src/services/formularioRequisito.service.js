import { ApiError } from '../utils/apiError.js';
import FormularioRequisitoRepository from '../repositories/formularioRequisito.repository.js';

const INPUT_TYPES = ['archivo', 'texto', 'numero', 'fecha', 'lista', 'booleano'];
const MAX_NOMBRE_LENGTH = 150;
const MAX_DESCRIPCION_LENGTH = 500;
const MAX_TAMANO_MB = 50;

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return fallback;
    return value !== 0;
  }
  if (value == null) return fallback;
  return Boolean(value);
};

const toIntOrNull = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const sanitizeString = (value, maxLength) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
};

export class FormularioRequisitoService {
  static async listar({ idTipoServicio = null, idTipoTramite = null, soloActivos = true } = {}) {
    const idServicio = toIntOrNull(idTipoServicio);
    const idTramite = toIntOrNull(idTipoTramite);
    const activos = toBoolean(soloActivos, true);

    return FormularioRequisitoRepository.listar({
      idTipoServicio: idServicio,
      idTipoTramite: idTramite,
      soloActivos: activos
    });
  }

  static async listarPublico({ idTipoServicio, idTipoTramite = null } = {}) {
    const idServicio = toIntOrNull(idTipoServicio);
    if (!idServicio) {
      throw new ApiError('Debe indicar el tipo de servicio para obtener sus requisitos', 400);
    }

    const idTramite = toIntOrNull(idTipoTramite);
    return FormularioRequisitoRepository.listar({
      idTipoServicio: idServicio,
      idTipoTramite: idTramite,
      soloActivos: true
    });
  }

  static validarPayload(payload = {}) {
    const nombre = sanitizeString(payload.nombre_corto ?? payload.nombreCorto, MAX_NOMBRE_LENGTH);
    if (!nombre) {
      throw new ApiError('El nombre corto del requisito es obligatorio', 400);
    }

    const descripcion = sanitizeString(payload.descripcion, MAX_DESCRIPCION_LENGTH);
    const idTipoServicio = toIntOrNull(payload.id_tipo_servicio ?? payload.idTipoServicio);
    if (!idTipoServicio) {
      throw new ApiError('Debe asociar el requisito a un tipo de servicio válido', 400);
    }

    const idTipoTramite = toIntOrNull(payload.id_tipo_tramite ?? payload.idTipoTramite);
    const tipoInput = sanitizeString(payload.tipo_input ?? payload.tipoInput, 50)?.toLowerCase() || 'archivo';
    if (!INPUT_TYPES.includes(tipoInput)) {
      throw new ApiError('El tipo de input indicado no es válido', 400);
    }

    const tamanoMax = toIntOrNull(payload.tamano_max_mb ?? payload.tamanoMaxMb);
    if (tamanoMax != null && (tamanoMax <= 0 || tamanoMax > MAX_TAMANO_MB)) {
      throw new ApiError(`El tamaño máximo debe estar entre 1 y ${MAX_TAMANO_MB}MB`, 400);
    }

    const ordenVisual = toIntOrNull(payload.orden_visual ?? payload.ordenVisual) ?? 1;
    if (ordenVisual <= 0) {
      throw new ApiError('El orden visual debe ser un entero positivo', 400);
    }

    return {
      id_tipo_servicio: idTipoServicio,
      id_tipo_tramite: idTipoTramite,
      nombre_corto: nombre,
      descripcion,
      es_obligatorio: toBoolean(payload.es_obligatorio ?? payload.esObligatorio, true),
      tipo_input: tipoInput,
      tipo_archivo_permitido: sanitizeString(payload.tipo_archivo_permitido ?? payload.tipoArchivoPermitido, 100),
      tamano_max_mb: tamanoMax,
      orden_visual: ordenVisual,
      activo: toBoolean(payload.activo, true)
    };
  }

  static async crear(payload = {}) {
    const datosValidados = this.validarPayload(payload);
    const resultado = await FormularioRequisitoRepository.guardar(datosValidados);
    return resultado[0] || null;
  }

  static async actualizar(idRequisito, payload = {}) {
    const idParsed = toIntOrNull(idRequisito);
    if (!idParsed) {
      throw new ApiError('El identificador del requisito es inválido', 400);
    }

    const datosValidados = this.validarPayload(payload);
    const resultado = await FormularioRequisitoRepository.guardar({
      ...datosValidados,
      id_requisito: idParsed
    });

    const requisitoActualizado = resultado[0] || null;
    if (!requisitoActualizado) {
      throw new ApiError('No se encontró el requisito solicitado', 404);
    }

    return requisitoActualizado;
  }
}

export default FormularioRequisitoService;
