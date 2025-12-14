// src/database/sqlserver.js
// Configuración y cliente para SQL Server usando mssql

import sql from 'mssql';

const config = {
  server: process.env.SQLSERVER_HOST || 'localhost',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  database: process.env.SQLSERVER_DATABASE || 'sustancias_controladas_db',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.SQLSERVER_USER || 'sa',
      password: process.env.SQLSERVER_PASSWORD || 'YourPassword123!'
    }
  },
  options: {
    trustServerCertificate: true,
    encrypt: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    min: 0,
    max: 10
  }
};

let pool = null;

export async function getConnectionPool() {
  if (!pool) {
    try {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
      console.log('Conectado a SQL Server exitosamente');
      return pool;
    } catch (error) {
      console.error('Error conectando a SQL Server:', error);
      throw error;
    }
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Conexión a SQL Server cerrada');
  }
}

export async function executeQuery(query, params = {}) {
  try {
    const pool = await getConnectionPool();
    const request = pool.request();
    
    // Agregar parámetros a la consulta
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Error en consulta SQL:', error);
    throw error;
  }
}

export async function executeTransaction(queries) {
  try {
    const pool = await getConnectionPool();
    const transaction = new sql.Transaction(pool);
    
    await transaction.begin();
    
    const request = new sql.Request(transaction);
    const results = [];
    
    for (const query of queries) {
      const result = await request.query(query);
      results.push(result);
    }
    
    await transaction.commit();
    return results;
  } catch (error) {
    console.error('Error en transacción:', error);
    throw error;
  }
}

export default getConnectionPool;
