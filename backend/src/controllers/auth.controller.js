import AuthService from '../services/auth.service.js';
import EmpleadoService from '../services/empleado.service.js';
import EmailService from '../services/email.service.js';
import { ApiError } from '../utils/apiError.js';

const renderHtmlResponse = ({ title, message, actionLabel, actionUrl }) => {
  const safeTitle = title || 'Operación completada';
  const safeMessage = message || '';
  const button = actionLabel && actionUrl
    ? `<a class="button" href="${actionUrl}">${actionLabel}</a>`
    : '';

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${safeTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 60px auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); text-align: center; }
        h1 { color: #1e293b; }
        p { color: #475569; line-height: 1.5; }
        a.button { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0f766e; color: #fff; text-decoration: none; border-radius: 999px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${safeTitle}</h1>
        <p>${safeMessage}</p>
        ${button}
      </div>
    </body>
  </html>`;
};

/**
 * Controlador de Autenticación
 */
export class AuthController {
  /**
   * POST /api/auth/registro-solicitante
   */
  static async registroSolicitante(req, res, next) {
    try {
      const resultado = await AuthService.registroSolicitante(req.body);
      if (resultado?.confirmacion?.token) {
        await EmailService.sendSolicitanteConfirmation({
          to: resultado.solicitante.email,
          nombre: req.body?.nombre_completo,
          token: resultado.confirmacion.token
        });
        delete resultado.confirmacion.token;
      }
      res.status(201).json({
        success: true,
        message: 'Solicitante registrado exitosamente. Revisa tu correo para confirmar tu cuenta.',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login-solicitante
   */
  static async loginSolicitante(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const resultado = await AuthService.loginSolicitante(email, password);
      res.json({
        success: true,
        message: 'Login exitoso',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login-empleado
   */
  static async loginEmpleado(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const resultado = await AuthService.loginEmpleado(email, password);
      res.json({
        success: true,
        message: 'Login exitoso',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/cambiar-contraseña
   */
  static async cambiarContraseña(req, res, next) {
    try {
      const { passwordActual, passwordNueva } = req.body;
      const tipoUsuario = req.user?.tipo_usuario;

      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas son requeridas'
        });
      }

      if (!tipoUsuario) {
        throw new ApiError('No se pudo identificar el tipo de usuario', 403);
      }

      let resultado;

      if (tipoUsuario === 'SOLICITANTE') {
        resultado = await AuthService.cambiarContraseñaSolicitante(
          req.user.id_solicitante,
          passwordActual,
          passwordNueva
        );
      } else if (tipoUsuario === 'EMPLEADO') {
        resultado = await EmpleadoService.cambiarContraseña(
          req.user.id_empleado,
          passwordActual,
          passwordNueva
        );
      } else {
        throw new ApiError('Este tipo de usuario no puede usar este endpoint', 403);
      }

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente',
        data: {
          ...resultado,
          tipo_usuario: tipoUsuario
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify
   */
  static async verify(req, res) {
    res.json({
      success: true,
      message: 'Token válido',
      user: req.user
    });
  }

  /**
   * POST /api/auth/solicitante/confirmar-email
   */
  static async confirmarEmailSolicitante(req, res, next) {
    try {
      const { token } = req.body;
      const data = await AuthService.confirmarEmailSolicitante(token);
      res.json({
        success: true,
        message: 'Correo confirmado exitosamente',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/solicitante/solicitar-reset
   */
  static async solicitarResetPasswordSolicitante(req, res, next) {
    try {
      const { email } = req.body;
      const resultado = await AuthService.solicitarResetPasswordSolicitante(email);

      if (resultado?.token) {
        await EmailService.sendPasswordResetEmail({
          to: resultado.solicitante.email,
          nombre: resultado.solicitante?.nombre_completo,
          token: resultado.token,
          tipo: 'solicitante'
        });
      }

      res.json({
        success: true,
        message: 'Si el correo existe, se envió un enlace para restablecer la contraseña'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/solicitante/restablecer-password
   */
  static async restablecerPasswordSolicitante(req, res, next) {
    try {
      const { token, passwordNueva } = req.body;
      const data = await AuthService.restablecerPasswordSolicitante(token, passwordNueva);

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/empleado/confirmar-email
   */
  static async confirmarEmailEmpleado(req, res, next) {
    try {
      const { token } = req.body;
      const data = await EmpleadoService.confirmarEmailPorToken(token);

      res.json({
        success: true,
        message: 'Correo institucional confirmado',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/empleado/solicitar-reset
   */
  static async solicitarResetPasswordEmpleado(req, res, next) {
    try {
      const { email } = req.body;
      const resultado = await EmpleadoService.solicitarResetPassword(email);

      if (resultado?.token) {
        await EmailService.sendPasswordResetEmail({
          to: resultado.empleado.email,
          nombre: resultado.empleado.nombre_completo,
          token: resultado.token,
          tipo: 'empleado'
        });
      }

      res.json({
        success: true,
        message: 'Si el correo existe, se envió un enlace para restablecer la contraseña'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/empleado/restablecer-password
   */
  static async restablecerPasswordEmpleado(req, res, next) {
    try {
      const { token, passwordNueva } = req.body;
      const data = await EmpleadoService.restablecerPasswordPorToken(token, passwordNueva);

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmarEmailSolicitanteLink(req, res) {
    const { token } = req.query;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    if (!token) {
      return res.status(400).send(renderHtmlResponse({
        title: 'Token inválido',
        message: 'No se recibió un token de confirmación válido.'
      }));
    }

    try {
      await AuthService.confirmarEmailSolicitante(token);
      return res.send(renderHtmlResponse({
        title: 'Correo confirmado',
        message: 'Tu cuenta fue activada correctamente. Ya puedes iniciar sesión.',
        actionLabel: 'Ir al login',
        actionUrl: loginUrl
      }));
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send(renderHtmlResponse({
        title: 'No se pudo confirmar el correo',
        message: error.message || 'El token no es válido o expiró.'
      }));
    }
  }

  static async confirmarEmailEmpleadoLink(req, res) {
    const { token } = req.query;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login-empleado`;

    if (!token) {
      return res.status(400).send(renderHtmlResponse({
        title: 'Token inválido',
        message: 'No se recibió un token de activación válido.'
      }));
    }

    try {
      await EmpleadoService.confirmarEmailPorToken(token);
      return res.send(renderHtmlResponse({
        title: 'Cuenta activada',
        message: 'Tu correo fue confirmado y puedes iniciar sesión con tu contraseña temporal.',
        actionLabel: 'Ir al login de empleados',
        actionUrl: loginUrl
      }));
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send(renderHtmlResponse({
        title: 'No se pudo activar la cuenta',
        message: error.message || 'El token no es válido o expiró.'
      }));
    }
  }
}

export default AuthController;
