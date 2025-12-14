#!/usr/bin/env node

/**
 * Script de prueba básico para verificar endpoints
 * Uso: node test-api.js
 */

const BASE_URL = 'http://localhost:5000/api';

async function testRequest(method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de API...\n');

  // Test 1: Health Check
  console.log('📋 Test 1: Health Check');
  const health = await testRequest('GET', '/health');
  console.log(`Status: ${health.status}`);
  console.log(`Result: ${health.success ? '✅ OK' : '❌ FAIL'}\n`);

  // Test 2: Registro de Solicitante
  console.log('📋 Test 2: Registro de Solicitante');
  const registro = await testRequest('POST', '/auth/registro-solicitante', {
    nombre_completo: 'Test Usuario',
    email: 'test@example.com',
    password: 'password123',
    cedula_identidad: '12345678',
    telefono: '8095551234',
    celular: '8491112345',
    tipo_entidad: 'FARMACIA',
    nombre_entidad: 'Test Farmacia'
  });
  console.log(`Status: ${registro.status}`);
  console.log(`Result: ${registro.success ? '✅ OK' : '❌ FAIL'}`);
  if (!registro.success) console.log(`Error: ${JSON.stringify(registro.data)}`);
  
  let token = null;
  if (registro.success && registro.data.data?.token) {
    token = registro.data.data.token;
    console.log(`Token: ${token.substring(0, 20)}...\n`);
  } else {
    console.log('⚠️  No se obtuvo token, saltando pruebas autenticadas\n');
  }

  // Test 3: Login Solicitante
  if (!token) {
    console.log('📋 Test 3: Login Solicitante');
    const login = await testRequest('POST', '/auth/login-solicitante', {
      email: 'usuario@example.com',
      password: 'password123'
    });
    console.log(`Status: ${login.status}`);
    console.log(`Result: ${login.success ? '✅ OK' : '❌ FAIL'}`);
    if (login.success && login.data.data?.token) {
      token = login.data.data.token;
      console.log(`Token: ${token.substring(0, 20)}...\n`);
    }
  }

  // Test 4: Obtener Perfil
  if (token) {
    console.log('📋 Test 4: Obtener Perfil');
    const perfil = await testRequest('GET', '/solicitantes/perfil', null, token);
    console.log(`Status: ${perfil.status}`);
    console.log(`Result: ${perfil.success ? '✅ OK' : '❌ FAIL'}\n`);
  }

  // Test 5: Listar Solicitudes
  if (token) {
    console.log('📋 Test 5: Listar Solicitudes');
    const solicitudes = await testRequest('GET', '/solicitudes', null, token);
    console.log(`Status: ${solicitudes.status}`);
    console.log(`Result: ${solicitudes.success ? '✅ OK' : '❌ FAIL'}`);
    if (solicitudes.data?.data) {
      console.log(`Total: ${solicitudes.data.total || solicitudes.data.data.length}\n`);
    } else {
      console.log(`Response: ${JSON.stringify(solicitudes.data)}\n`);
    }
  }

  console.log('✅ Pruebas completadas');
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
