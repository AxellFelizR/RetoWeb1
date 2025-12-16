import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ApiError } from '../utils/apiError.js';
import { EmpleadoRepository } from '../repositories/empleado.repository.js';

/**
 * Servicio de Empleados
 */
export class EmpleadoService {
  /**
   * Crear nuevo empleado
   */
  static async crearEmpleado(datos) {
    try {
      const {
        nombre_completo,
        email,
        cedula,
        cedula_identidad,
        rol,
        departamento,
        estado_empleado = 'ACTIVO'
      } = datos;

      const cedulaFinal = cedula || cedula_identidad;
      if (!cedulaFinal) {
        throw new ApiError('La cédula es requerida', 400);
      }

      const totalEmail = await EmpleadoRepository.contarPorEmail(email);
      if (totalEmail > 0) {
        throw new ApiError('El email ya está registrado', 409);
      }

      const passwordPlano = datos.password || this.generarPasswordTemporal();
      const passwordHash = await bcrypt.hash(passwordPlano, 10);
      const tokenConfirmacion = this.generarTokenSeguro();
      const expira = this.calcularExpiracionHoras(72);

      const empleado = await EmpleadoRepository.crearEmpleado({
        nombre_completo,
        cedula: cedulaFinal,
        email,
        password_hash: passwordHash,
        rol,
        departamento: departamento || '',
        estado_empleado,
        token_confirmacion: tokenConfirmacion,
        token_confirmacion_expira: expira,
        password_temporal: true
      });

      return {
        empleado: empleado
          ? {
              id_empleado: empleado.id_empleado,
              nombre_completo: empleado.nombre_completo,
              email: empleado.email,
              rol: empleado.rol,
              departamento: empleado.departamento
            }
          : null,
        tokenConfirmacion,
        tempPassword: passwordPlano
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener empleado por ID
   */
  static async obtenerPorId(id) {
    try {
      return await EmpleadoRepository.obtenerPorId(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar empleados
   */
  static async listar(filtros = {}) {
    try {
      return await EmpleadoRepository.listar(filtros);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar empleado
   */
  static async actualizar(id, datos) {
    try {
      const campos = ['nombre_completo', 'rol', 'departamento', 'estado_empleado'];
      const tieneDatos = campos.some((campo) => Boolean(datos?.[campo]));
      if (!tieneDatos) {
        throw new ApiError('No hay datos para actualizar', 400);
      }


      const actualizado = await EmpleadoRepository.actualizarEmpleado(id, datos);
      if (!actualizado) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      return actualizado;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar empleado (soft delete)
   */
  static async eliminar(id) {
    try {
      const eliminado = await EmpleadoRepository.eliminarEmpleado(id);

      if (!eliminado) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      return { id_empleado: id, eliminado: true };
    } catch (error) {
      const sqlErrorNumber = error?.number || error?.originalError?.info?.number;
      if (sqlErrorNumber === 547) {
        throw new ApiError(
          'No se puede eliminar el empleado porque tiene referencias activas en solicitudes o historiales. ' +
          'Reasigna los expedientes o ejecuta la migración de llaves foraneas antes de eliminar.',
          409
        );
      }
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async cambiarContraseña(id, passwordActual, passwordNueva) {
    try {
      const empleado = await this.obtenerPorId(id);

      if (!empleado) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      if (!passwordNueva || passwordNueva.length < 8) {
        throw new ApiError('La nueva contraseña debe tener al menos 8 caracteres', 400);
      }

      // Obtener password hash
      const credenciales = await EmpleadoRepository.obtenerPasswordHash(id);
      if (!credenciales) {
        throw new ApiError('Empleado no encontrado', 404);
      }

      const passwordValida = await bcrypt.compare(passwordActual, credenciales.password_hash);
      if (!passwordValida) {
        throw new ApiError('Contraseña actual incorrecta', 401);
      }

      const hashNueva = await bcrypt.hash(passwordNueva, 10);

      await EmpleadoRepository.actualizarPassword(id, hashNueva, false);

      return { id_empleado: id, actualizado: true, password_temporal: false };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirmar email vía token
   */
  static async confirmarEmailPorToken(token) {
    if (!token) {
      throw new ApiError('Token es requerido', 400);
    }

    const empleado = await EmpleadoRepository.obtenerPorTokenConfirmacion(token);

    if (!empleado) {
      throw new ApiError('Token inválido o ya utilizado', 400);
    }

    if (empleado.email_confirmado) {
      return { id_empleado: empleado.id_empleado, email_confirmado: true };
    }

    if (empleado.token_confirmacion_expira && empleado.token_confirmacion_expira < new Date()) {
      throw new ApiError('El token de confirmación ha expirado', 410);
    }

    await EmpleadoRepository.confirmarEmail(empleado.id_empleado);

    return { id_empleado: empleado.id_empleado, email_confirmado: true };
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  static async solicitarResetPassword(email) {
    if (!email) {
      throw new ApiError('Email es requerido', 400);
    }

    const empleado = await EmpleadoRepository.obtenerPorEmail(email);

    if (!empleado) {
      return null;
    }

    const token = this.generarTokenSeguro();
    const expira = this.calcularExpiracionHoras(2);

    await EmpleadoRepository.registrarTokenReset(empleado.id_empleado, token, expira);

    return {
      empleado,
      token
    };
  }

  /**
   * Restablecer contraseña con token
   */
  static async restablecerPasswordPorToken(token, passwordNueva) {
    if (!token || !passwordNueva) {
      throw new ApiError('Token y nueva contraseña son requeridos', 400);
    }

    if (passwordNueva.length < 8) {
      throw new ApiError('La contraseña debe tener al menos 8 caracteres', 400);
    }

    const empleado = await EmpleadoRepository.obtenerPorTokenReset(token);

    if (!empleado) {
      throw new ApiError('Token inválido o ya utilizado', 400);
    }

    if (empleado.token_reset_expira && empleado.token_reset_expira < new Date()) {
      throw new ApiError('El token de restablecimiento ha expirado', 410);
    }

    const hashNueva = await bcrypt.hash(passwordNueva, 10);

    await EmpleadoRepository.restablecerPassword(empleado.id_empleado, hashNueva);

    return {
      id_empleado: empleado.id_empleado,
      email: empleado.email
    };
  }

  static generarPasswordTemporal(length = 10) {
    const raw = crypto.randomBytes(16).toString('base64').replaceAll(/[^a-zA-Z0-9]/g, '');
    return raw.slice(0, length).padEnd(length, 'A');
  }

  static generarTokenSeguro(bytes = 40) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  static calcularExpiracionHoras(horas = 48) {
    return new Date(Date.now() + horas * 60 * 60 * 1000);
  }
}

export default EmpleadoService;
