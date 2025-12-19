import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  CREAR: 'sp_solicitante_crear',
  EXISTE_EMAIL: 'sp_solicitante_existe_email',
  OBTENER_POR_EMAIL: 'sp_solicitante_obtener_por_email',
  OBTENER_POR_ID: 'sp_solicitante_obtener_por_id',
  ACTUALIZAR_ULTIMO_ACCESO: 'sp_solicitante_actualizar_ultimo_acceso',
  GUARDAR_TOKEN_CONFIRMACION: 'sp_solicitante_guardar_token_confirmacion',
  OBTENER_POR_TOKEN_CONFIRMACION: 'sp_solicitante_obtener_por_token_confirmacion',
  CONFIRMAR_EMAIL: 'sp_solicitante_confirmar_email',
  ELIMINAR_NO_CONFIRMADO: 'sp_solicitante_eliminar_si_no_confirmado',
  GUARDAR_TOKEN_RESET: 'sp_solicitante_guardar_token_reset',
  OBTENER_POR_TOKEN_RESET: 'sp_solicitante_obtener_por_token_reset',
  ACTUALIZAR_PASSWORD: 'sp_solicitante_actualizar_password',
  OBTENER_PASSWORD_HASH: 'sp_solicitante_obtener_password_hash'
});

export class SolicitanteRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static mapSolicitante(record) {
    return record || null;
  }

  static normalizeDatos(datos) {
    const DEFAULT_TIPO_SOLICITANTE = 'PROFESIONAL';

    return {
      // El tipo de solicitante para registros externos siempre es fijo y solo lo puede cambiar un administrador.
      tipo_solicitante: DEFAULT_TIPO_SOLICITANTE,
      email: datos.email?.trim(),
      password_hash: datos.password_hash,
      telefono: datos.telefono || datos.celular || '',
      nombre_completo: datos.nombre_completo || '',
      cedula_identidad: datos.cedula_identidad || '',
      cedula_electoral: datos.cedula_electoral || '',
      exequatur: datos.exequatur || '',
      profesion: datos.profesion || '',
      numero_colegiatura: datos.numero_colegiatura || '',
      codigo_colegio: datos.codigo_colegio || '',
      direccion_postal: datos.direccion_postal || '',
      telefono_residencial: datos.telefono_residencial || '',
      telefono_celular: datos.telefono_celular || datos.celular || '',
      lugar_trabajo: datos.lugar_trabajo || '',
      email_trabajo: datos.email_trabajo || '',
      direccion_trabajo: datos.direccion_trabajo || '',
      telefono_trabajo: datos.telefono_trabajo || '',
      fecha_nacimiento: datos.fecha_nacimiento || null
    };
  }

  static async crearSolicitante(datos) {
    this.ensurePool();
    const payload = this.normalizeDatos(datos);

    if (!payload.email || !payload.password_hash) {
      throw new Error('Email y password_hash son requeridos');
    }

    try {
      const request = db.pool.request()
        .input('tipo_solicitante', sql.VarChar(50), payload.tipo_solicitante)
        .input('email', sql.VarChar(100), payload.email)
        .input('password_hash', sql.VarChar(255), payload.password_hash)
        .input('telefono', sql.VarChar(20), payload.telefono)
        .input('nombre_completo', sql.VarChar(100), payload.nombre_completo)
        .input('cedula_identidad', sql.VarChar(20), payload.cedula_identidad)
        .input('cedula_electoral', sql.VarChar(20), payload.cedula_electoral)
        .input('exequatur', sql.VarChar(20), payload.exequatur)
        .input('profesion', sql.VarChar(100), payload.profesion)
        .input('numero_colegiatura', sql.VarChar(50), payload.numero_colegiatura)
        .input('codigo_colegio', sql.VarChar(20), payload.codigo_colegio)
        .input('direccion_postal', sql.VarChar(255), payload.direccion_postal)
        .input('telefono_residencial', sql.VarChar(20), payload.telefono_residencial)
        .input('telefono_celular', sql.VarChar(20), payload.telefono_celular)
        .input('lugar_trabajo', sql.VarChar(100), payload.lugar_trabajo)
        .input('email_trabajo', sql.VarChar(100), payload.email_trabajo)
        .input('direccion_trabajo', sql.VarChar(255), payload.direccion_trabajo)
        .input('telefono_trabajo', sql.VarChar(20), payload.telefono_trabajo)
        .input('fecha_nacimiento', sql.Date, payload.fecha_nacimiento);

      const resultado = await request.execute(STORED_PROCEDURES.CREAR);
      const id = resultado.recordset?.[0]?.id_solicitante;

      return {
        id_solicitante: id,
        email: payload.email,
        tipo_solicitante: payload.tipo_solicitante,
        fecha_registro: new Date()
      };
    } catch (error) {
      console.error('Error creando solicitante:', error);
      throw error;
    }
  }

  static async existeEmail(email) {
    this.ensurePool();
    if (!email) return false;
    try {
      const result = await db.pool.request()
        .input('email', sql.VarChar(100), email.trim())
        .execute(STORED_PROCEDURES.EXISTE_EMAIL);
      return Boolean(result.recordset?.[0]?.existe);
    } catch (error) {
      console.error('Error verificando email:', error);
      throw error;
    }
  }

  static async obtenerPorEmail(email) {
    this.ensurePool();
    if (!email) return null;
    try {
      const result = await db.pool.request()
        .input('email', sql.VarChar(100), email.trim())
        .execute(STORED_PROCEDURES.OBTENER_POR_EMAIL);
      return this.mapSolicitante(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo solicitante por email:', error);
      throw error;
    }
  }

  static async obtenerPorId(idSolicitante) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .execute(STORED_PROCEDURES.OBTENER_POR_ID);
      return this.mapSolicitante(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo solicitante por ID:', error);
      throw error;
    }
  }

  static async actualizar(idSolicitante) {
    await this.actualizarUltimoAcceso(idSolicitante);
    return this.obtenerPorId(idSolicitante);
  }

  static async actualizarUltimoAcceso(idSolicitante) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .execute(STORED_PROCEDURES.ACTUALIZAR_ULTIMO_ACCESO);
    } catch (error) {
      console.error('Error actualizando último acceso:', error);
      throw error;
    }
  }

  static async guardarTokenConfirmacion(idSolicitante, token, expira) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .input('token', sql.VarChar(128), token)
        .input('expira', sql.DateTime, expira)
        .execute(STORED_PROCEDURES.GUARDAR_TOKEN_CONFIRMACION);
    } catch (error) {
      console.error('Error guardando token de confirmación:', error);
      throw error;
    }
  }

  static async obtenerPorTokenConfirmacion(token) {
    this.ensurePool();
    if (!token) return null;
    try {
      const result = await db.pool.request()
        .input('token', sql.VarChar(128), token)
        .execute(STORED_PROCEDURES.OBTENER_POR_TOKEN_CONFIRMACION);
      return this.mapSolicitante(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo token de confirmación:', error);
      throw error;
    }
  }

  static async confirmarEmail(idSolicitante) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .execute(STORED_PROCEDURES.CONFIRMAR_EMAIL);
    } catch (error) {
      console.error('Error confirmando email:', error);
      throw error;
    }
  }

  static async eliminarSiNoConfirmado(idSolicitante) {
    this.ensurePool();
    if (!idSolicitante) {
      return false;
    }
    try {
      const result = await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .execute(STORED_PROCEDURES.ELIMINAR_NO_CONFIRMADO);

      const filas = result.recordset?.[0]?.filas_afectadas ?? 0;
      return filas > 0;
    } catch (error) {
      console.error('Error eliminando solicitante no confirmado:', error);
      throw error;
    }
  }

  static async guardarTokenResetPassword(idSolicitante, token, expira) {
    this.ensurePool();
    try {
      await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .input('token', sql.VarChar(128), token)
        .input('expira', sql.DateTime, expira)
        .execute(STORED_PROCEDURES.GUARDAR_TOKEN_RESET);
    } catch (error) {
      console.error('Error guardando token de reset:', error);
      throw error;
    }
  }

  static async obtenerPorTokenResetPassword(token) {
    this.ensurePool();
    if (!token) return null;
    try {
      const result = await db.pool.request()
        .input('token', sql.VarChar(128), token)
        .execute(STORED_PROCEDURES.OBTENER_POR_TOKEN_RESET);
      return this.mapSolicitante(result.recordset?.[0] || null);
    } catch (error) {
      console.error('Error obteniendo token de reset:', error);
      throw error;
    }
  }

  static async obtenerPasswordHash(idSolicitante) {
    this.ensurePool();
    try {
      const result = await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .execute(STORED_PROCEDURES.OBTENER_PASSWORD_HASH);

      return result.recordset?.[0] || null;
    } catch (error) {
      console.error('Error obteniendo password hash de solicitante:', error);
      throw error;
    }
  }

  static async actualizarPasswordHash(idSolicitante, passwordHash) {
    this.ensurePool();
    if (!passwordHash) {
      throw new Error('passwordHash requerido');
    }
    try {
      await db.pool.request()
        .input('id_solicitante', sql.Int, Number.parseInt(idSolicitante, 10))
        .input('password_hash', sql.VarChar(255), passwordHash)
        .execute(STORED_PROCEDURES.ACTUALIZAR_PASSWORD);
    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      throw error;
    }
  }
}

export default SolicitanteRepository;
