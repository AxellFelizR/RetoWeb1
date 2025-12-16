import FormularioRequisitoService from '../services/formularioRequisito.service.js';

const parseBoolQuery = (value, fallback = true) => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return fallback;
    return value !== 0;
  }
  if (typeof value === 'boolean') return value;
  return fallback;
};

export class FormularioRequisitoController {
  static async listar(req, res, next) {
    try {
      const filtros = {
        idTipoServicio: req.query.idTipoServicio ?? req.query.id_tipo_servicio,
        idTipoTramite: req.query.idTipoTramite ?? req.query.id_tipo_tramite,
        soloActivos: parseBoolQuery(req.query.soloActivos ?? req.query.solo_activos, false)
      };

      const requisitos = await FormularioRequisitoService.listar(filtros);
      res.json({ success: true, data: requisitos });
    } catch (error) {
      next(error);
    }
  }

  static async listarPublico(req, res, next) {
    try {
      const filtros = {
        idTipoServicio: req.query.idTipoServicio ?? req.query.id_tipo_servicio,
        idTipoTramite: req.query.idTipoTramite ?? req.query.id_tipo_tramite
      };

      const requisitos = await FormularioRequisitoService.listarPublico(filtros);
      res.json({ success: true, data: requisitos });
    } catch (error) {
      next(error);
    }
  }

  static async crear(req, res, next) {
    try {
      const requisito = await FormularioRequisitoService.crear(req.body);
      res.status(201).json({
        success: true,
        message: 'Requisito creado correctamente',
        data: requisito
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizar(req, res, next) {
    try {
      const requisito = await FormularioRequisitoService.actualizar(req.params.idRequisito, req.body);
      res.json({
        success: true,
        message: 'Requisito actualizado correctamente',
        data: requisito
      });
    } catch (error) {
      next(error);
    }
  }
}

export default FormularioRequisitoController;
