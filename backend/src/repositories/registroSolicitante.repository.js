import sql from 'mssql';
import { db } from '../database/db.js';

const STORED_PROCEDURES = Object.freeze({
  CREAR: 'sp_registro_solicitante_crear',
  OBTENER_POR_TOKEN: 'sp_registro_solicitante_obtener_por_token',
  OBTENER_POR_EMAIL: 'sp_registro_solicitante_obtener_por_email',
  ELIMINAR: 'sp_registro_solicitante_eliminar'
});

const parsePayload = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('No se pudo parsear datos_payload de registro pendiente', error?.message);
    return null;
  }
};

export class RegistroSolicitanteRepository {
  static ensurePool() {
    if (!db.pool) {
      throw new Error('Conexión a SQL Server no inicializada');
    }
  }

  static mapRecord(record) {
    if (!record) return null;
    return {
      id_registro: record.id_registro,
      email: record.email,
      datos: parsePayload(record.datos_payload),
      datos_payload: record.datos_payload,
      token_confirmacion: record.token_confirmacion,
      expira: record.expira,
      creado_en: record.creado_en
    };
  }

  static async crearRegistro({ email, datos, token_confirmacion, expira }) {
    this.ensurePool();
    if (!email || !datos || !token_confirmacion || !expira) {
      throw new Error('Datos incompletos para crear registro pendiente');
    }

    const payload = JSON.stringify(datos);

    const resultado = await db.pool.request()
      .input('email', sql.VarChar(255), email.trim())
      .input('datos_payload', sql.NVarChar(sql.MAX), payload)
      .input('token_confirmacion', sql.VarChar(128), token_confirmacion)
      .input('expira', sql.DateTime, expira)
      .execute(STORED_PROCEDURES.CREAR);

    return this.mapRecord(resultado.recordset?.[0] || null);
  }

  static async obtenerPorToken(token) {
    this.ensurePool();
    if (!token) return null;

    const resultado = await db.pool.request()
      .input('token_confirmacion', sql.VarChar(128), token)
      .execute(STORED_PROCEDURES.OBTENER_POR_TOKEN);

    return this.mapRecord(resultado.recordset?.[0] || null);
  }

  static async obtenerPorEmail(email) {
    this.ensurePool();
    if (!email) return null;

    const resultado = await db.pool.request()
      .input('email', sql.VarChar(255), email.trim())
      .execute(STORED_PROCEDURES.OBTENER_POR_EMAIL);

    return this.mapRecord(resultado.recordset?.[0] || null);
  }

  static async eliminarRegistro(idRegistro) {
    this.ensurePool();
    if (!idRegistro) return false;

    const resultado = await db.pool.request()
      .input('id_registro', sql.Int, Number.parseInt(idRegistro, 10))
      .execute(STORED_PROCEDURES.ELIMINAR);

    const filas = resultado.recordset?.[0]?.filas_afectadas ?? 0;
    return filas > 0;
  }
}

export default RegistroSolicitanteRepository;
