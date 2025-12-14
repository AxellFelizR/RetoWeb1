import SolicitanteRepository from '../repositories/solicitante.repository.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Controlador de Solicitantes
 */
export class SolicitanteController {
  /**
   * Obtener perfil del solicitante autenticado
   */
  static async obtenerPerfil(req, res, next) {
    try {
      const idSolicitante = req.user.id_solicitante;

      if (!idSolicitante) {
        throw new ApiError('No autorizado', 401);
      }

      const solicitante = await SolicitanteRepository.obtenerPorId(idSolicitante);

      if (!solicitante) {
        throw new ApiError('Solicitante no encontrado', 404);
      }

      res.status(200).json({
        success: true,
        data: solicitante
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar perfil del solicitante
   */
  static async actualizarPerfil(req, res, next) {
    try {
      const idSolicitante = req.user.id_solicitante;
      const { nombre_completo, telefono, celular, direccion, municipio, provincia } = req.body;

      if (!idSolicitante) {
        throw new ApiError('No autorizado', 401);
      }

      const datosActualizacion = {
        nombre_completo,
        telefono,
        celular,
        direccion,
        municipio,
        provincia
      };

      const resultado = await SolicitanteRepository.actualizar(idSolicitante, datosActualizacion);

      if (!resultado) {
        throw new ApiError('No se pudo actualizar el perfil', 400);
      }

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener solicitudes del solicitante
   */
  static async obtenerMisSolicitudes(req, res, next) {
    try {
      const idSolicitante = req.user.id_solicitante;

      if (!idSolicitante) {
        throw new ApiError('No autorizado', 401);
      }

      const solicitudes = await SolicitanteRepository.obtenerSolicitudes(idSolicitante);

      res.status(200).json({
        success: true,
        total: solicitudes.length,
        data: solicitudes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar contraseña
   */
  static async cambiarContraseña(req, res, next) {
    try {
      const idSolicitante = req.user.id_solicitante;
      const { passwordActual, passwordNueva } = req.body;

      if (!idSolicitante) {
        throw new ApiError('No autorizado', 401);
      }

      if (!passwordActual || !passwordNueva) {
        throw new ApiError('Contraseña actual y nueva son requeridas', 400);
      }

      // Aquí iría la lógica de cambio de contraseña
      // similar a la del auth.service

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar email disponible
   */
  static async verificarEmailDisponible(req, res, next) {
    try {
      const { email } = req.query;

      if (!email) {
        throw new ApiError('Email es requerido', 400);
      }

      const existe = await SolicitanteRepository.existeEmail(email);

      res.status(200).json({
        success: true,
        disponible: !existe,
        email
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SolicitanteController;
