import TipoServicioService from '../services/tipoServicio.service.js';

export class TipoServicioController {
  static async listar(req, res, next) {
    try {
      const incluirInactivos = req.query.includeInactivos === 'true' || req.query.todos === 'true';
      const servicios = await TipoServicioService.listar({ incluirInactivos });
      res.json({ success: true, data: servicios });
    } catch (error) {
      next(error);
    }
  }

  static async crear(req, res, next) {
    try {
      const servicio = await TipoServicioService.crear(req.body);
      res.status(201).json({
        success: true,
        message: 'Servicio creado exitosamente',
        data: servicio
      });
    } catch (error) {
      next(error);
    }
  }
}

export default TipoServicioController;
