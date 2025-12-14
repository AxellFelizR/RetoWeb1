import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión SQL Server
const sqlConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_DATABASE || 'DB_SUSTANCIAS_CONTROLADAS_DO',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || ''
    }
  },
  options: {
    trustServerCertificate: true,
    encrypt: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
};

// Crear pool de conexiones
let pool;

async function initializePool() {
  try {
    pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    console.log(' Conectado a SQL Server exitosamente');
  } catch (error) {
    console.error(' Error al conectar con SQL Server:', error.message);
    // Reintentar conexión en 5 segundos
    setTimeout(initializePool, 5000);
  }
}

// Inicializar conexión
initializePool();

// Exportar pool y funciones helper
export const db = {
  pool,
  query: async (query, params = []) => {
    if (!pool) throw new Error('Pool no inicializado');
    try {
      const request = pool.request();
      let queryStr = query;
      
      // Convertir parámetros a formato SQL Server (@param)
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
        queryStr = queryStr.replace('?', `@param${index}`);
      });
      
      return await request.query(queryStr);
    } catch (error) {
      console.error('Error en query:', error);
      throw error;
    }
  }
};

export default db;