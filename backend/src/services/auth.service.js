import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import SolicitanteRepository from '../repositories/solicitante.repository.js';
import { EmpleadoRepository } from '../repositories/empleado.repository.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Servicio de Autenticación
 */
export class AuthService {
  /**
   * Registro de solicitante
   */
  static async registroSolicitante(datos) {
    try {
      const { email, password, confirmPassword } = datos;

      // Validar contraseñas coincidan
      if (password !== confirmPassword) {
        throw new ApiError('Las contraseñas no coinciden', 400);
      }

      // Validar longitud
      if (password.length < 8) {
        throw new ApiError('La contraseña debe tener al menos 8 caracteres', 400);
      }

      // Verificar si email ya existe
      const solicitanteExistente = await SolicitanteRepository.obtenerPorEmail(email);
      if (solicitanteExistente) {
        if (solicitanteExistente.email_confirmado) {
          throw new ApiError('Este email ya está registrado', 409);
        }

        const tokenExpira = solicitanteExistente.token_confirmacion_expira;
        const token = solicitanteExistente.token_confirmacion;
        const tokenVencido = !token || (tokenExpira && tokenExpira < new Date());

        if (tokenVencido) {
          await SolicitanteRepository.eliminarSiNoConfirmado(solicitanteExistente.id_solicitante);
        } else {
          throw new ApiError('Ya existe un registro pendiente por confirmar para este email', 409);
        }
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear solicitante
      const solicitante = await SolicitanteRepository.crearSolicitante({
        ...datos,
        password_hash: passwordHash
      });

      const tokenConfirmacion = this.generarTokenSeguro();
      const expira = this.calcularExpiracionHoras(48);

      await SolicitanteRepository.guardarTokenConfirmacion(
        solicitante.id_solicitante,
        tokenConfirmacion,
        expira
      );

      return {
        solicitante: {
          id_solicitante: solicitante.id_solicitante,
          email: solicitante.email,
          tipo_solicitante: solicitante.tipo_solicitante,
          nombre_completo: solicitante.nombre_completo || null,
          cedula_identidad: solicitante.cedula_identidad || null,
          telefono: solicitante.telefono || null,
          profesion: solicitante.profesion || null
        },
        confirmacion: {
          token: tokenConfirmacion,
          expira
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login de solicitante
   */
  static async loginSolicitante(email, password) {
    try {
      const solicitante = await SolicitanteRepository.obtenerPorEmail(email);

      if (!solicitante) {
        throw new ApiError('Email o contraseña incorrectos', 401);
      }

      if (solicitante.estado_cuenta !== 'ACTIVA') {
        throw new ApiError('Cuenta inactiva o suspendida', 403);
      }

      if (!solicitante.email_confirmado) {
        throw new ApiError('Debes confirmar tu correo electrónico para iniciar sesión', 403);
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, solicitante.password_hash);
      if (!passwordValida) {
        throw new ApiError('Email o contraseña incorrectos', 401);
      }

      // Actualizar último acceso
      await SolicitanteRepository.actualizarUltimoAcceso(solicitante.id_solicitante);

      // Generar token
      const token = jwt.sign(
        {
          id_solicitante: solicitante.id_solicitante,
          email: solicitante.email,
          tipo_usuario: 'SOLICITANTE'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
      );

      return {
        token,
        solicitante: {
          id_solicitante: solicitante.id_solicitante,
          email: solicitante.email,
          tipo_solicitante: solicitante.tipo_solicitante,
          nombre_completo: solicitante.nombre_completo || null,
          cedula_identidad: solicitante.cedula_identidad || null,
          telefono: solicitante.telefono || null,
          profesion: solicitante.profesion || null
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login de empleado
   */
  static async loginEmpleado(email, password) {
    try {
      const empleado = await EmpleadoRepository.obtenerPorEmail(email);

      if (!empleado) {
        throw new ApiError('Email o contraseña incorrectos', 401);
      }

      if (empleado.estado_empleado !== 'ACTIVO') {
        throw new ApiError('Empleado inactivo o suspendido', 403);
      }

      if (!empleado.email_confirmado) {
        throw new ApiError('Debes confirmar tu correo institucional para iniciar sesión', 403);
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, empleado.password_hash);
      if (!passwordValida) {
        throw new ApiError('Email o contraseña incorrectos', 401);
      }

      // Generar token
      const token = jwt.sign(
        {
          id_empleado: empleado.id_empleado,
          email: empleado.email,
          rol: empleado.rol,
          tipo_usuario: 'EMPLEADO'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
      );

      return {
        token,
        empleado: {
          id_empleado: empleado.id_empleado,
          nombre_completo: empleado.nombre_completo,
          email: empleado.email,
          rol: empleado.rol,
          departamento: empleado.departamento,
          password_temporal: Boolean(empleado.password_temporal)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar token (útil para renovación)
   */
  static async verificarToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Token expirado', 401);
      }
      throw new ApiError('Token inválido', 401);
    }
  }

  /**
   * Cambiar contraseña de solicitante
   */
  static async cambiarContraseñaSolicitante(idSolicitante, passwordActual, passwordNueva) {
    try {
      const solicitante = await SolicitanteRepository.obtenerPorId(idSolicitante);

      if (!solicitante) {
        throw new ApiError('Solicitante no encontrado', 404);
      }

      // Verificar contraseña actual
      const credenciales = await SolicitanteRepository.obtenerPasswordHash(idSolicitante);

      if (!credenciales?.password_hash) {
        throw new ApiError('Solicitante no encontrado', 404);
      }

      const passwordValida = await bcrypt.compare(passwordActual, credenciales.password_hash);
      if (!passwordValida) {
        throw new ApiError('Contraseña actual incorrecta', 401);
      }

      // Validar nueva contraseña
      if (passwordNueva.length < 8) {
        throw new ApiError('La contraseña debe tener al menos 8 caracteres', 400);
      }

      // Hashear nueva contraseña
      const hashNueva = await bcrypt.hash(passwordNueva, 10);

      // Actualizar
      await SolicitanteRepository.actualizarPasswordHash(idSolicitante, hashNueva);

      return {
        id_solicitante: idSolicitante,
        email: solicitante.email || credenciales.email,
        mensaje: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirmar email de solicitante
   */
  static async confirmarEmailSolicitante(token) {
    if (!token) {
      throw new ApiError('Token de confirmación es requerido', 400);
    }

    const solicitante = await SolicitanteRepository.obtenerPorTokenConfirmacion(token);

    if (!solicitante) {
      throw new ApiError('Token inválido o ya utilizado', 400);
    }

    if (solicitante.email_confirmado) {
      return {
        id_solicitante: solicitante.id_solicitante,
        email_confirmado: true
      };
    }

    if (solicitante.token_confirmacion_expira && solicitante.token_confirmacion_expira < new Date()) {
      await SolicitanteRepository.eliminarSiNoConfirmado(solicitante.id_solicitante);
      throw new ApiError('El token de confirmación ha expirado. Debes registrarte nuevamente.', 410);
    }

    await SolicitanteRepository.confirmarEmail(solicitante.id_solicitante);

    return {
      id_solicitante: solicitante.id_solicitante,
      email_confirmado: true
    };
  }

  /**
   * Generar token de restablecimiento para solicitante
   */
  static async solicitarResetPasswordSolicitante(email) {
    if (!email) {
      throw new ApiError('Email es requerido', 400);
    }

    const solicitante = await SolicitanteRepository.obtenerPorEmail(email);

    if (!solicitante) {
      return null;
    }

    const token = this.generarTokenSeguro();
    const expira = this.calcularExpiracionHoras(2);

    await SolicitanteRepository.guardarTokenResetPassword(solicitante.id_solicitante, token, expira);

    return {
      solicitante,
      token
    };
  }

  /**
   * Restablecer contraseña usando token
   */
  static async restablecerPasswordSolicitante(token, passwordNueva) {
    if (!token || !passwordNueva) {
      throw new ApiError('Token y nueva contraseña son requeridos', 400);
    }

    if (passwordNueva.length < 8) {
      throw new ApiError('La contraseña debe tener al menos 8 caracteres', 400);
    }

    const solicitante = await SolicitanteRepository.obtenerPorTokenResetPassword(token);

    if (!solicitante) {
      throw new ApiError('Token inválido o ya utilizado', 400);
    }

    if (solicitante.token_reset_expira && solicitante.token_reset_expira < new Date()) {
      throw new ApiError('El token de restablecimiento ha expirado', 410);
    }

    const hashNueva = await bcrypt.hash(passwordNueva, 10);
    await SolicitanteRepository.actualizarPasswordHash(solicitante.id_solicitante, hashNueva);

    return {
      id_solicitante: solicitante.id_solicitante,
      email: solicitante.email
    };
  }

  /**
   * Generar tokens seguros reutilizables
   */
  static generarTokenSeguro(bytes = 40) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  static calcularExpiracionHoras(horas = 24) {
    return new Date(Date.now() + horas * 60 * 60 * 1000);
  }
}

export default AuthService;
