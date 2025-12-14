#!/usr/bin/env node
import 'dotenv/config'
import sql from 'mssql'
import bcrypt from 'bcryptjs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const sqlConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '1433', 10),
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
    encrypt: true
  }
}

const defaults = {
  nombre: 'Administrador General',
  cedula: '00000000000',
  email: 'admin@msp.gob.do',
  departamento: 'DIRECCION GENERAL'
}

const rl = createInterface({ input, output })

async function ask(question, fallback) {
  const answer = (await rl.question(`${question} (${fallback}): `)).trim()
  return answer || fallback
}

async function askPassword() {
  const attempt = (await rl.question('Contraseña (mínimo 8 caracteres): ')).trim()
  if (attempt.length < 8) {
    output.write('La contraseña debe tener al menos 8 caracteres. Intenta de nuevo.\n')
    return askPassword()
  }
  return attempt
}

try {
    output.write('\n=== Creación de cuenta ADMIN ===\n')
    const nombre = await ask('Nombre completo', defaults.nombre)
    const cedula = await ask('Cédula', defaults.cedula)
    const email = await ask('Correo institucional', defaults.email)
    const departamento = await ask('Departamento', defaults.departamento)
    const password = await askPassword()

    rl.close()

    const pool = await sql.connect(sqlConfig)
    const passwordHash = await bcrypt.hash(password, 10)

    const result = await pool.request()
      .input('Nombre', sql.NVarChar(255), nombre)
      .input('Cedula', sql.NVarChar(20), cedula)
      .input('Email', sql.NVarChar(255), email)
      .input('PasswordHash', sql.NVarChar(255), passwordHash)
      .input('Departamento', sql.NVarChar(100), departamento)
      .output('EmpleadoId', sql.Int)
      .output('FueActualizado', sql.Bit)
      .execute('sp_upsert_admin_empleado')

    const empleadoId = result.output.EmpleadoId ?? result.recordset?.[0]?.id_empleado
    const fueActualizado = result.output.FueActualizado ?? result.recordset?.[0]?.fue_actualizado === true

    if (fueActualizado) {
      output.write(`\nCuenta ADMIN actualizada (ID ${empleadoId}).\n`)
    } else {
      output.write(`\nCuenta ADMIN creada (ID ${empleadoId}).\n`)
    }

    output.write('\nPuedes iniciar sesión en /login-empleado con estas credenciales y administrar roles desde el módulo de empleados.\n')
    await pool.close()
  } catch (error) {
    rl.close()
    console.error('No se pudo crear la cuenta ADMIN:', error.message)
    process.exitCode = 1
}
