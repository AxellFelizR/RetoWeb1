import { ApiError } from '../utils/apiError.js';
import TipoServicioRepository from '../repositories/tipoServicio.repository.sqlserver.js';

const MAX_COSTO = 1000000;
const MAX_DIAS_RESPUESTA = 365;

export class TipoServicioService {
  static async listar(opciones = {}) {
    return TipoServicioRepository.listar(opciones);
  }

  static async crear(payload = {}) {
    const nombre = (payload.nombre_servicio || '').trim();
    const descripcion = (payload.descripcion || '').trim();
    const diasRespuesta = Number.parseInt(payload.dias_respuesta ?? 0, 10);
    const requiereCosto = Boolean(payload.requiere_costo_administrativo);
    const costo = Number.parseFloat(payload.costo_administrativo ?? 0);

    if (!nombre) {
      throw new ApiError('El nombre del servicio es obligatorio', 400);
    }

    if (Number.isNaN(diasRespuesta) || diasRespuesta < 0 || diasRespuesta > MAX_DIAS_RESPUESTA) {
      throw new ApiError('Los días de respuesta deben estar entre 0 y 365', 400);
    }

    if (requiereCosto) {
      if (Number.isNaN(costo) || costo < 0 || costo > MAX_COSTO) {
        throw new ApiError('El costo administrativo es inválido', 400);
      }
    }

    const existente = await TipoServicioRepository.obtenerPorNombre(nombre);
    if (existente) {
      throw new ApiError('Ya existe un servicio con este nombre', 409);
    }

    return TipoServicioRepository.crear({
      nombre_servicio: nombre,
      descripcion,
      dias_respuesta: diasRespuesta,
      requiere_costo_administrativo: requiereCosto,
      costo_administrativo: requiereCosto ? costo : 0,
      estado_servicio: 'ACTIVO'
    });
  }
}

export default TipoServicioService;
