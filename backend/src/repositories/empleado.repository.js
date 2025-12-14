import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  VALIDAR_EMAIL: 'sp_empleado_validar_email',
  CREAR: 'sp_empleado_crear',
  OBTENER_POR_ID: 'sp_empleado_obtener_por_id',
  LISTAR: 'sp_empleado_listar',
  ACTUALIZAR: 'sp_empleado_actualizar_datos',
  ELIMINAR: 'sp_empleado_eliminar',
  OBTENER_PASSWORD_HASH: 'sp_empleado_obtener_password_hash',
  ACTUALIZAR_PASSWORD: 'sp_empleado_actualizar_password',
  OBTENER_POR_TOKEN_CONFIRMACION: 'sp_empleado_obtener_por_token_confirmacion',
  CONFIRMAR_EMAIL: 'sp_empleado_confirmar_email',
  OBTENER_POR_EMAIL: 'sp_empleado_obtener_por_email',
  REGISTRAR_TOKEN_RESET: 'sp_empleado_registrar_token_reset',
  OBTENER_POR_TOKEN_RESET: 'sp_empleado_obtener_por_token_reset',
  RESTABLECER_PASSWORD: 'sp_empleado_restablecer_password'
});

const mapEmpleado = (record) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    fecha_ingreso: record.fecha_ingreso || null,
    fecha_creacion: record.fecha_creacion || null
  };
};

export class EmpleadoRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexion a SQL Server no inicializada');
    }
  }

  static async contarPorEmail(email) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('email', sql.VarChar(255), email)
        .execute(STORED_PROCEDURES.VALIDAR_EMAIL);

      return resultado.recordset?.[0]?.total ?? 0;
    } catch (error) {
      console.error('Error al validar email de empleado:', error);
      throw error;
    }
  }

  static async crearEmpleado(datos) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('nombre_completo', sql.VarChar(255), datos.nombre_completo)
        .input('cedula', sql.VarChar(20), datos.cedula)
        .input('email', sql.VarChar(255), datos.email)
        .input('password_hash', sql.VarChar(255), datos.password_hash)
        .input('rol', sql.VarChar(50), datos.rol)
        .input('departamento', sql.VarChar(100), datos.departamento || '')
        .input('estado_empleado', sql.VarChar(20), datos.estado_empleado || 'ACTIVO')
        .input('token_confirmacion', sql.VarChar(128), datos.token_confirmacion)
        .input('token_confirmacion_expira', sql.DateTime, datos.token_confirmacion_expira)
        .input('password_temporal', sql.Bit, datos.password_temporal ? 1 : 0)
        .execute(STORED_PROCEDURES.CREAR);

      return mapEmpleado(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error al crear empleado:', error);
      throw error;
    }
  }

  static async obtenerPorId(idEmpleado) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);

      return mapEmpleado(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error al obtener empleado por ID:', error);
      throw error;
    }
  }

  static async listar(filtros = {}) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('rol', sql.VarChar(50), filtros.rol || null)
        .input('departamento', sql.VarChar(100), filtros.departamento || null)
        .input('estado_empleado', sql.VarChar(20), filtros.estado_empleado || null)
        .execute(STORED_PROCEDURES.LISTAR);

      return resultado.recordset?.map((record) => mapEmpleado(record)) || [];
    } catch (error) {
      console.error('Error al listar empleados:', error);
      throw error;
    }
  }

  static async actualizarEmpleado(idEmpleado, datos) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .input('nombre_completo', sql.VarChar(255), datos.nombre_completo || null)
        .input('rol', sql.VarChar(50), datos.rol || null)
        .input('departamento', sql.VarChar(100), datos.departamento || null)
        .input('estado_empleado', sql.VarChar(20), datos.estado_empleado || null)
        .execute(STORED_PROCEDURES.ACTUALIZAR);

      return mapEmpleado(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      throw error;
    }
  }

  static async eliminarEmpleado(idEmpleado) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .execute(STORED_PROCEDURES.ELIMINAR);

      const filas = resultado.recordset?.[0]?.filas_afectadas ?? 0;
      return filas > 0;
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      throw error;
    }
  }

  static async obtenerPasswordHash(idEmpleado) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .execute(STORED_PROCEDURES.OBTENER_PASSWORD_HASH);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error al obtener password hash de empleado:', error);
      throw error;
    }
  }

  static async actualizarPassword(idEmpleado, hash, passwordTemporal = false) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .input('password_hash', sql.VarChar(255), hash)
        .input('password_temporal', sql.Bit, passwordTemporal ? 1 : 0)
        .execute(STORED_PROCEDURES.ACTUALIZAR_PASSWORD);

      return true;
    } catch (error) {
      console.error('Error al actualizar password de empleado:', error);
      throw error;
    }
  }

  static async obtenerPorTokenConfirmacion(token) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('token', sql.VarChar(128), token)
        .execute(STORED_PROCEDURES.OBTENER_POR_TOKEN_CONFIRMACION);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error al obtener empleado por token de confirmacion:', error);
      throw error;
    }
  }

  static async confirmarEmail(idEmpleado) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .execute(STORED_PROCEDURES.CONFIRMAR_EMAIL);

      const filas = resultado.recordset?.[0]?.filas_afectadas ?? 0;
      return filas > 0;
    } catch (error) {
      console.error('Error al confirmar email de empleado:', error);
      throw error;
    }
  }

  static async obtenerPorEmail(email) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('email', sql.VarChar(255), email)
        .execute(STORED_PROCEDURES.OBTENER_POR_EMAIL);

      return mapEmpleado(resultado.recordset?.[0] || null);
    } catch (error) {
      console.error('Error al obtener empleado por email:', error);
      throw error;
    }
  }

  static async registrarTokenReset(idEmpleado, token, expira) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .input('token', sql.VarChar(128), token)
        .input('expira', sql.DateTime, expira)
        .execute(STORED_PROCEDURES.REGISTRAR_TOKEN_RESET);

      return true;
    } catch (error) {
      console.error('Error al registrar token de reset para empleado:', error);
      throw error;
    }
  }

  static async obtenerPorTokenReset(token) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('token', sql.VarChar(128), token)
        .execute(STORED_PROCEDURES.OBTENER_POR_TOKEN_RESET);

      return resultado.recordset?.[0] || null;
    } catch (error) {
      console.error('Error al obtener empleado por token de reset:', error);
      throw error;
    }
  }

  static async restablecerPassword(idEmpleado, hash) {
    this.ensurePool();
    try {
      const resultado = await db.pool.request()
        .input('id_empleado', sql.Int, Number.parseInt(idEmpleado, 10))
        .input('password_hash', sql.VarChar(255), hash)
        .execute(STORED_PROCEDURES.RESTABLECER_PASSWORD);

      const filas = resultado.recordset?.[0]?.filas_afectadas ?? 0;
      return filas > 0;
    } catch (error) {
      console.error('Error al restablecer password de empleado:', error);
      throw error;
    }
  }
}

export default EmpleadoRepository;
