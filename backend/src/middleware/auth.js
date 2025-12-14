import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';

// AUTENTICACIÓN

/**
 * Middleware para verificar JWT
 */
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError('Token no proporcionado', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message
      });
    }
  }
};

// AUTORIZACIÓN POR ROLES

/**
 * Middleware para verificar que el usuario es Solicitante
 */
export const requireSolicitante = (req, res, next) => {
  if (req.user?.tipo_usuario !== 'SOLICITANTE') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Solo solicitantes pueden acceder a este recurso'
    });
  }
  next();
};

 // Middleware para verificar que el usuario es Empleado
export const requireEmpleado = (req, res, next) => {
  if (req.user?.tipo_usuario !== 'EMPLEADO') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Solo empleados pueden acceder a este recurso'
    });
  }
  next();
};


 // Middleware para verificar rol específico
 // Uso: requireRole('VENTANILLA', 'UPC', 'DIRECCION', 'DNCD', 'ADMIN')

export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user?.rol || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }
    next();
  };
};


 // Middleware para verificar múltiples roles (OR)
export const requireAnyRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user?.rol || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }
    next();
  };
};


 // Middleware para verificar que solo el propietario puede ver su recurso

export const requireOwnResource = (resourceType = 'id_solicitante') => {
  return (req, res, next) => {
    const resourceId = req.params.id || req.body[resourceType];
    
    if (req.user?.tipo_usuario === 'SOLICITANTE' && 
        req.user?.id_solicitante != resourceId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este recurso'
      });
    }
    next();
  };
};


// MANEJO DE PERMISOS ESPECÍFICOS



 // Middleware para permitir acceso según el flujo de estado

export const requiredStateTransition = (estadosPermitidos) => {
  return async (req, res, next) => {
    try {
      const { id_solicitud } = req.params;
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

export default {
  verifyToken,
  requireSolicitante,
  requireEmpleado,
  requireRole,
  requireAnyRole,
  requireOwnResource
};
