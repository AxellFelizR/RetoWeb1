// Script para insertar datos de prueba en la base de datos
import sql from 'mssql';
import { db } from '../src/database/db.js';

try {
  console.log('Conectando a la base de datos...');
  
  // Inicializar conexión si no está lista
  if (!db.pool.connected) {
    console.log('Pool no está conectado, conectando...');
    await db.pool.connect();
  }
    
    const tiposServicio = [
      {
        nombre_servicio: 'Autorización de Uso',
        descripcion: 'Autorización para uso de sustancias controladas',
        dias_respuesta: 30
      },
      {
        nombre_servicio: 'Licencia de Importación',
        descripcion: 'Licencia para importación de sustancias controladas',
        dias_respuesta: 45
      },
      {
        nombre_servicio: 'Licencia de Distribución',
        descripcion: 'Licencia para distribución de sustancias controladas',
        dias_respuesta: 30
      }
    ];

    const tiposTramite = [
      {
        servicio_nombre: 'Autorización de Uso',
        nombre_tramite: 'Trámite Normal',
        descripcion: 'Trámite ordinario de autorización',
        requiere_costo: 1,
        costo_tramite: 0,
        campos_obligatorios: ['cedula', 'establecimiento']
      },
      {
        servicio_nombre: 'Autorización de Uso',
        nombre_tramite: 'Trámite Expedito',
        descripcion: 'Trámite expedito de autorización',
        requiere_costo: 1,
        costo_tramite: 500,
        campos_obligatorios: ['cedula', 'establecimiento']
      },
      {
        servicio_nombre: 'Licencia de Importación',
        nombre_tramite: 'Importación Ordinaria',
        descripcion: 'Importación ordinaria de sustancias',
        requiere_costo: 1,
        costo_tramite: 1000,
        campos_obligatorios: ['cedula', 'establecimiento']
      },
      {
        servicio_nombre: 'Licencia de Distribución',
        nombre_tramite: 'Distribución Normal',
        descripcion: 'Distribución normal de sustancias',
        requiere_costo: 1,
        costo_tramite: 750,
        campos_obligatorios: ['cedula', 'establecimiento']
      }
    ];

    const serviciosJson = JSON.stringify(tiposServicio);
    const tramitesJson = JSON.stringify(
      tiposTramite.map((tramite) => ({
        ...tramite,
        campos_obligatorios: JSON.stringify(tramite.campos_obligatorios)
      }))
    );

    console.log('Sincronizando catálogos con procedimiento almacenado...');
    await db.pool.request()
      .input('ServiciosJson', sql.NVarChar(sql.MAX), serviciosJson)
      .input('TramitesJson', sql.NVarChar(sql.MAX), tramitesJson)
      .execute('sp_seed_catalogos_basicos');

    console.log('\nBase de datos sembrada exitosamente');
    process.exit(0);
} catch (error) {
  console.error('Error sembrando base de datos:', error.message);
  console.error(error);
  process.exit(1);
}
