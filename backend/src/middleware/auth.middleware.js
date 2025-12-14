import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clavesecreta';


 //Middleware para verificar token JWT

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Token inválido o expirado', 401));
    }
  }
};


 // Middleware para requerir autenticación como solicitante

export const requireSolicitante = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.tipo_usuario !== 'SOLICITANTE') {
      throw new ApiError('Acceso denegado - Se requiere autenticación como solicitante', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Token inválido o expirado', 401));
    }
  }
};

 // Middleware para requerir autenticación como empleado

export const requireEmpleado = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.tipo_usuario !== 'EMPLEADO') {
      throw new ApiError('Acceso denegado - Se requiere autenticación como empleado', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Token inválido o expirado', 401));
    }
  }
};

 // Middleware para permitir acceso tanto a empleados como a solicitantes

export const requireEmpleadoOrSolicitante = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const tipo = decoded.tipo_usuario;

    if (!['EMPLEADO', 'SOLICITANTE'].includes(tipo)) {
      throw new ApiError('Acceso denegado - Tipo de usuario no autorizado', 403);
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Token inválido o expirado', 401));
    }
  }
};

// Middleware para requerir rol específico
 
export const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new ApiError('No autorizado - Token no proporcionado', 401);
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (!rolesPermitidos.includes(decoded.rol)) {
        throw new ApiError(`Acceso denegado - Se requiere rol: ${rolesPermitidos.join(', ')}`, 403);
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Token inválido o expirado', 401));
      }
    }
  };
};

// Middleware para requerir autenticación

export const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError('No autorizado - Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Token inválido o expirado', 401));
    }
  }
};

export default {
  verifyToken,
  requireSolicitante,
  requireEmpleado,
  requireEmpleadoOrSolicitante,
  requireRole,
  requireAuth
};
