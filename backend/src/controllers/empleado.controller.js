import EmpleadoService from '../services/empleado.service.js';
import EmailService from '../services/email.service.js';
import { ApiError } from '../utils/apiError.js';


 // Controlador de Empleados

export class EmpleadoController {

   // Crear empleado (solo admin/gerente)
 
  static async crearEmpleado(req, res, next) {
    try {
      const { nombre_completo, email, cedula, cedula_identidad, rol, departamento } = req.body;

      // Validar datos requeridos
      if (!nombre_completo || !email || !rol || !departamento) {
        throw new ApiError('Faltan datos requeridos', 400);
      }

      const resultado = await EmpleadoService.crearEmpleado({
        nombre_completo,
        email,
        cedula: cedula || cedula_identidad,
        cedula_identidad,
        rol,
        departamento
      });

      if (resultado?.tokenConfirmacion) {
        await EmailService.sendEmpleadoConfirmation({
          to: resultado.empleado.email,
          nombre: resultado.empleado.nombre_completo,
          token: resultado.tokenConfirmacion,
          tempPassword: resultado.tempPassword
        });
      }

      res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente. El enlace de activación fue enviado por correo.',
        data: resultado.empleado
      });
    } catch (error) {
      next(error);
    }
  }


   // Obtener empleado por ID

  static async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;

      const empleado = await EmpleadoService.obtenerPorId(Number.parseInt(id, 10));

      if (!empleado) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      res.status(200).json({
        success: true,
        data: empleado
      });
    } catch (error) {
      next(error);
    }
  }


   // Listar empleados

  static async listar(req, res, next) {
    try {
      const filtros = {
        rol: req.query.rol,
        departamento: req.query.departamento,
        estado_empleado: req.query.estado_empleado || 'ACTIVO'
      };

      const empleados = await EmpleadoService.listar(filtros);

      res.status(200).json({
        success: true,
        total: empleados.length,
        data: empleados
      });
    } catch (error) {
      next(error);
    }
  }


   // Actualizar empleado

  static async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const datos = req.body;

      if (!Object.keys(datos).length) {
        throw new ApiError('No hay datos para actualizar', 400);
      }

      const resultado = await EmpleadoService.actualizar(Number.parseInt(id, 10), datos);

      if (!resultado) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Empleado actualizado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  
   // Eliminar empleado
  static async eliminar(req, res, next) {
    try {
      const { id } = req.params;

      const resultado = await EmpleadoService.eliminar(Number.parseInt(id, 10));

      res.status(200).json({
        success: true,
        message: 'Empleado eliminado exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }


   // Cambiar contraseña
   
  static async cambiarContraseña(req, res, next) {
    try {
      const { id } = req.params;
      const { passwordActual, passwordNueva } = req.body;

      if (!passwordActual || !passwordNueva) {
        throw new ApiError('Contraseña actual y nueva son requeridas', 400);
      }

      const resultado = await EmpleadoService.cambiarContraseña(
        Number.parseInt(id, 10),
        passwordActual,
        passwordNueva
      );

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

export default EmpleadoController;
