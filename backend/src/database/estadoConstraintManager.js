import sql from 'mssql';
import { db } from './db.js';
import { ESTADOS_CATALOGO_DEFINICION } from '../constants/estadosSolicitud.js';

let constraintSincronizado = false;

const catalogoEstadosJson = JSON.stringify(
  ESTADOS_CATALOGO_DEFINICION.map(({ nombre, descripcion, inicial, final, orden }) => ({
    nombre_estado: nombre,
    descripcion,
    es_inicial: inicial ? 1 : 0,
    es_final: final ? 1 : 0,
    orden
  }))
);

export async function ensureEstadosSolicitudIntegridad() {
  if (constraintSincronizado) {
    return;
  }

  if (!db.pool) {
    console.warn('Pool de base de datos no inicializado. No se pudo sincronizar estados.');
    return;
  }

  try {
    await db.pool
      .request()
      .input('EstadosJson', sql.NVarChar(sql.MAX), catalogoEstadosJson)
      .execute('sp_sync_estado_solicitud');

    constraintSincronizado = true;
  } catch (error) {
    console.error('No se pudieron sincronizar los estados permitidos:', error.message);
  }
}
