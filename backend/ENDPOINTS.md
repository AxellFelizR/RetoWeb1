# API REST - Sistema de Gestión de Sustancias Controladas

## Estado: ✅ 100% IMPLEMENTADO

**Base URL:** `http://localhost:5000/api`

---

## 📋 ÍNDICE DE ENDPOINTS

### 1. [Autenticación](#autenticación)
### 2. [Solicitantes](#solicitantes)
### 3. [Solicitudes](#solicitudes)
### 4. [Empleados](#empleados)
### 5. [Pagos](#pagos)
### 6. [Archivos](#archivos)
### 7. [Bandeja de Trabajo](#bandeja-de-trabajo)
### 8. [Reportes](#reportes)
### 9. [Certificados](#certificados)

---

## 🔐 Autenticación

### Registro de Solicitante
```http
POST /auth/registro-solicitante
Content-Type: application/json

{
  "nombre_completo": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "cedula_identidad": "12345678",
  "telefono": "8095551234",
  "celular": "8491112345",
  "tipo_entidad": "FARMACIA",
  "nombre_entidad": "Farmacia Central"
}
```
**Response:** 201 Created
```json
{
  "success": true,
  "message": "Solicitante registrado exitosamente",
  "data": {
    "id_solicitante": 1,
    "nombre_completo": "Juan Pérez",
    "email": "juan@example.com",
    "token": "eyJhbGc..."
  }
}
```

### Login Solicitante
```http
POST /auth/login-solicitante
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```
**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id_solicitante": 1,
    "nombre_completo": "Juan Pérez",
    "email": "juan@example.com",
    "token": "eyJhbGc..."
  }
}
```

### Login Empleado
```http
POST /auth/login-empleado
Content-Type: application/json

{
  "email": "empleado@dncd.do",
  "password": "password123"
}
```
**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "id_empleado": 1,
    "nombre_completo": "Carlos López",
    "email": "empleado@dncd.do",
    "rol": "VENTANILLA",
    "token": "eyJhbGc..."
  }
}
```

---

## 👤 Solicitantes

### Obtener Perfil
```http
GET /solicitantes/perfil
Authorization: Bearer {token}
```
**Response:** 200 OK

### Actualizar Perfil
```http
PUT /solicitantes/perfil
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre_completo": "Juan Carlos Pérez",
  "telefono": "8095551234",
  "celular": "8491112345",
  "direccion": "Calle Principal 123",
  "municipio": "Santo Domingo",
  "provincia": "Santo Domingo"
}
```
**Response:** 200 OK

### Obtener Mis Solicitudes
```http
GET /solicitantes/mis-solicitudes
Authorization: Bearer {token}
```
**Response:** 200 OK

### Verificar Email Disponible
```http
GET /solicitantes/verificar-email?email=nuevo@example.com
```
**Response:** 200 OK
```json
{
  "success": true,
  "disponible": true,
  "email": "nuevo@example.com"
}
```

### Cambiar Contraseña
```http
POST /solicitantes/cambiar-contrasena
Authorization: Bearer {token}
Content-Type: application/json

{
  "passwordActual": "password123",
  "passwordNueva": "newpassword456"
}
```
**Response:** 200 OK

---

## 📝 Solicitudes

### Crear Solicitud
```http
POST /solicitudes
Authorization: Bearer {token}
Content-Type: application/json

{
  "descripcion": "Solicitud de licencia para sustancias controladas",
  "tipo_solicitud": "LICENCIA",
  "justificacion": "Necesario para operaciones legales"
}
```
**Response:** 201 Created

### Listar Mis Solicitudes
```http
GET /solicitudes
Authorization: Bearer {token}
```
**Parámetros opcionales:**
- `estado`: REGISTRADA, VALIDADA, EN_REVISION_UPC, APROBADA, RECHAZADA
- `fechaDesde`: YYYY-MM-DD
- `fechaHasta`: YYYY-MM-DD

**Response:** 200 OK

### Obtener Detalle de Solicitud
```http
GET /solicitudes/:id
Authorization: Bearer {token}
```
**Response:** 200 OK

### Cambiar Estado de Solicitud
```http
PUT /solicitudes/:id/estado
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "nuevo_estado": "VALIDADA",
  "comentario": "Solicitud validada correctamente"
}
```
**Response:** 200 OK

### Agregar Sustancia a Solicitud
```http
POST /solicitudes/:id/sustancias
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_sustancia": 1,
  "cantidad_solicitada": 100,
  "unidad_medida": "KG"
}
```
**Response:** 201 Created

### Subir Archivo
```http
POST /solicitudes/:id/archivos
Authorization: Bearer {token}
Content-Type: multipart/form-data

archivo: [file]
categoria: DOCUMENTACION
```
**Response:** 201 Created

### Obtener Archivos de Solicitud
```http
GET /solicitudes/:id/archivos
Authorization: Bearer {token}
```
**Response:** 200 OK

### Eliminar Archivo
```http
DELETE /solicitudes/:id/archivos/:idArchivo
Authorization: Bearer {token}
```
**Response:** 200 OK

### Obtener Historial de Solicitud
```http
GET /solicitudes/:id/historial
Authorization: Bearer {token}
```
**Response:** 200 OK

---

## 👨‍💼 Empleados

### Listar Empleados
```http
GET /empleados
Authorization: Bearer {token} (empleado)
```
**Parámetros opcionales:**
- `rol`: VENTANILLA, UPC, DIRECCIÓN, DNCD
- `departamento`: nombre del departamento
- `estado_empleado`: ACTIVO, INACTIVO

**Response:** 200 OK

### Obtener Empleado por ID
```http
GET /empleados/:id
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Crear Empleado
```http
POST /empleados
Authorization: Bearer {token} (empleado admin)
Content-Type: application/json

{
  "nombre_completo": "María González",
  "email": "maria@dncd.do",
  "password": "password123",
  "cedula_identidad": "87654321",
  "rol": "UPC",
  "departamento": "Unidad de Política Controlada"
}
```
**Response:** 201 Created

### Actualizar Empleado
```http
PUT /empleados/:id
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "nombre_completo": "María Rosa González",
  "rol": "DIRECCIÓN",
  "departamento": "Dirección General"
}
```
**Response:** 200 OK

### Eliminar Empleado (soft delete)
```http
DELETE /empleados/:id
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Cambiar Contraseña Empleado
```http
POST /empleados/:id/cambiar-contrasena
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "passwordActual": "password123",
  "passwordNueva": "newpassword456"
}
```
**Response:** 200 OK

---

## 💳 Pagos

### Crear Pago
```http
POST /pagos
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "id_solicitud": 1,
  "monto": 500.00,
  "concepto": "Licencia de sustancias controladas",
  "referencia_pago": "REF123456",
  "metodo_pago": "TRANSFERENCIA"
}
```
**Response:** 201 Created

### Listar Pagos
```http
GET /pagos
Authorization: Bearer {token} (empleado)
```
**Parámetros opcionales:**
- `estado_pago`: PENDIENTE, PAGADO, CANCELADO
- `metodo_pago`: EFECTIVO, TRANSFERENCIA, CHEQUE
- `fechaDesde`: YYYY-MM-DD
- `fechaHasta`: YYYY-MM-DD

**Response:** 200 OK

### Obtener Pago por ID
```http
GET /pagos/:id
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Obtener Pagos por Solicitud
```http
GET /pagos/solicitud/:id_solicitud
Authorization: Bearer {token}
```
**Response:** 200 OK

### Actualizar Estado de Pago
```http
PUT /pagos/:id/estado
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "estado_pago": "PAGADO"
}
```
**Response:** 200 OK

### Obtener Resumen de Pagos
```http
GET /pagos/resumen/general
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Obtener Pagos Pendientes
```http
GET /pagos/pendientes/lista
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

---

## 📂 Archivos

### Subir Archivo
```http
POST /archivos/subir
Authorization: Bearer {token}
Content-Type: multipart/form-data

archivo: [file]
id_solicitud: 1
tipo_archivo: DOCUMENTACION
```
**Response:** 201 Created

### Listar Archivos
```http
GET /archivos
Authorization: Bearer {token} (empleado)
```
**Parámetros opcionales:**
- `categoria`: GENERAL, DOCUMENTACION, CERTIFICADO
- `tipo_archivo`: PDF, JPG, PNG, DOC

**Response:** 200 OK

### Obtener Archivo por ID
```http
GET /archivos/:id
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Obtener Archivos por Solicitud
```http
GET /archivos/solicitud/:id_solicitud
Authorization: Bearer {token}
```
**Response:** 200 OK

### Obtener Archivos por Categoría
```http
GET /archivos/solicitud/:id_solicitud/:categoria
Authorization: Bearer {token}
```
**Response:** 200 OK

### Descargar Archivo
```http
GET /archivos/:id/descargar
Authorization: Bearer {token}
```
**Response:** 200 (archivo descargado)

### Eliminar Archivo
```http
DELETE /archivos/:id
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Obtener Estadísticas de Archivos
```http
GET /archivos/estadisticas
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

---

## 📊 Bandeja de Trabajo

### VENTANILLA - Obtener Solicitudes
```http
GET /bandeja/ventanilla
Authorization: Bearer {token} (empleado VENTANILLA)
```
**Response:** 200 OK (solicitudes con estado REGISTRADA)

### VENTANILLA - Validar Solicitud
```http
PUT /bandeja/ventanilla/:id_solicitud/validar
Authorization: Bearer {token} (empleado VENTANILLA)
Content-Type: application/json

{
  "comentario": "Documentación completa"
}
```
**Response:** 200 OK (cambio a VALIDADA)

### VENTANILLA - Rechazar Solicitud
```http
PUT /bandeja/ventanilla/:id_solicitud/rechazar
Authorization: Bearer {token} (empleado VENTANILLA)
Content-Type: application/json

{
  "motivo": "Documentación incompleta"
}
```
**Response:** 200 OK (cambio a RECHAZADA)

### UPC - Obtener Solicitudes
```http
GET /bandeja/upc
Authorization: Bearer {token} (empleado UPC)
```
**Response:** 200 OK (solicitudes con estado VALIDADA)

### UPC - Revisar Solicitud
```http
PUT /bandeja/upc/:id_solicitud/revisar
Authorization: Bearer {token} (empleado UPC)
Content-Type: application/json

{
  "comentario": "Revisión técnica completada"
}
```
**Response:** 200 OK (cambio a EN_REVISION_UPC)

> Nota: cuando el ENCARGADO_UPC abre la solicitud desde la bandeja, el sistema cambia automáticamente a **EN_ENCARGADO_UPC** para dejar rastro de la revisión en curso.

### DIRECCIÓN - Obtener Solicitudes
```http
GET /bandeja/direccion
Authorization: Bearer {token} (empleado DIRECCIÓN)
```
**Response:** 200 OK (solicitudes con estado EN_DIRECCION)

### DIRECCIÓN - Aprobar Solicitud
```http
PUT /bandeja/direccion/:id_solicitud/aprobar
Authorization: Bearer {token} (empleado DIRECCIÓN)
Content-Type: application/json

{
  "comentario": "Aprobado por Dirección"
}
```
**Response:** 200 OK (cambio a APROBADA)

### DIRECCIÓN - Rechazar Solicitud
```http
PUT /bandeja/direccion/:id_solicitud/rechazar
Authorization: Bearer {token} (empleado DIRECCIÓN)
Content-Type: application/json

{
  "motivo": "Incumplimiento de requisitos"
}
```
**Response:** 200 OK (cambio a RECHAZADA)

### DNCD - Obtener Solicitudes
```http
GET /bandeja/dncd
Authorization: Bearer {token} (empleado DNCD)
```
**Response:** 200 OK (solicitudes con estado APROBADA)

### DNCD - Emitir Resolución
```http
PUT /bandeja/dncd/:id_solicitud/resolucion
Authorization: Bearer {token} (empleado DNCD)
Content-Type: application/json

{
  "num_resolucion": "RES-2025-001",
  "fecha_resolucion": "2025-12-01"
}
```
**Response:** 200 OK (cambio a RESOLUCION_EMITIDA)

### DNCD - Generar Certificado
```http
POST /bandeja/dncd/:id_solicitud/certificado
Authorization: Bearer {token} (empleado DNCD)
```
**Response:** 200 OK

### Obtener Resumen de Bandeja
```http
GET /bandeja/resumen/general
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK (estadísticas de todas las bandejas)

---

## 📈 Reportes

### Reporte por Estado
```http
GET /reportes/solicitudes/estado
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte por Mes
```http
GET /reportes/solicitudes/mes
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte por Solicitante
```http
GET /reportes/solicitudes/solicitante?id_solicitante=1
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte de Sustancias
```http
GET /reportes/sustancias
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte de Pagos
```http
GET /reportes/pagos?estado=PAGADO
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte de Archivos
```http
GET /reportes/archivos
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte General
```http
GET /reportes/general
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

### Reporte de Actividad por Empleado
```http
GET /reportes/actividad/empleado
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

---

## 📜 Certificados

### Generar Certificado
```http
POST /certificados/generar/:id_solicitud
Authorization: Bearer {token} (empleado DNCD)
Content-Type: application/json

{
  "num_resolucion": "RES-2025-001",
  "fecha_emision": "2025-12-01"
}
```
**Response:** 201 Created

### Listar Certificados
```http
GET /certificados
Authorization: Bearer {token} (empleado)
```
**Parámetros opcionales:**
- `estado`: GENERADO, ENTREGADO, CANCELADO
- `fechaDesde`: YYYY-MM-DD
- `fechaHasta`: YYYY-MM-DD

**Response:** 200 OK

### Obtener Certificado por ID
```http
GET /certificados/:id
Authorization: Bearer {token}
```
**Response:** 200 OK

### Obtener Certificado por Solicitud
```http
GET /certificados/solicitud/:id_solicitud
Authorization: Bearer {token}
```
**Response:** 200 OK

### Descargar Certificado (PDF)
```http
GET /certificados/:id/descargar
Authorization: Bearer {token}
```
**Response:** 200 OK (PDF descargado)

### Actualizar Estado de Certificado
```http
PUT /certificados/:id/estado
Authorization: Bearer {token} (empleado)
Content-Type: application/json

{
  "estado": "ENTREGADO"
}
```
**Response:** 200 OK

### Obtener Estadísticas de Certificados
```http
GET /certificados/estadisticas/general
Authorization: Bearer {token} (empleado)
```
**Response:** 200 OK

---

## 🔒 Autenticación y Autorización

### Headers Requeridos
```
Authorization: Bearer {token_jwt}
Content-Type: application/json
```

### Tipos de Usuario
- **SOLICITANTE**: Persona natural o jurídica que solicita licencia
- **EMPLEADO**: Personal del DNCD con roles específicos

### Roles de Empleado
- **VENTANILLA**: Validación inicial de documentos
- **UPC**: Revisión técnica (Unidad de Política Controlada)
- **DIRECCIÓN**: Aprobación de dirección
- **DNCD**: Emisión de resoluciones y certificados
- **ADMIN**: Acceso total (gestión de usuarios y sistema)

---

## 📝 Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autorizado |
| 403 | Forbidden - Acceso denegado |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso duplicado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔗 URLs Base

- **Backend API**: `http://localhost:5000`
- **Frontend**: `http://localhost:3000`
- **Base de Datos**: `localhost\MSSQLSERVER01` (SQL Server)

---

## 📚 Tecnologías

- **Backend**: Node.js + Express.js
- **Frontend**: React + Vite
- **Base de Datos**: SQL Server 2019+
- **Autenticación**: JWT (JSON Web Tokens)
- **File Upload**: Multer

---

**Última actualización:** Diciembre 1, 2025
**Estado:** ✅ 100% FUNCIONAL
