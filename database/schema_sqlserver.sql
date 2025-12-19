-- ============================================================================
-- COPIEN, PEGUEN Y EJECUTEN TOODO LO QUE HAY AQUI, JUNTO, PERO PRIMERO CREEN LA BASE DE DATOS.
-- Base de datos completamente normalizada (3FN)
-- Para: SQL Server 2016+
-- ============================================================================

-- Drop existing tables (en orden inverso de dependencias)
IF OBJECT_ID('certificado', 'V') IS NOT NULL DROP VIEW certificado;
IF OBJECT_ID('log_acceso_sistema', 'U') IS NOT NULL DROP TABLE log_acceso_sistema;
IF OBJECT_ID('auditoria_cambios', 'U') IS NOT NULL DROP TABLE auditoria_cambios;
IF OBJECT_ID('certificado_emitido', 'U') IS NOT NULL DROP TABLE certificado_emitido;
IF OBJECT_ID('pago', 'U') IS NOT NULL DROP TABLE pago;
IF OBJECT_ID('archivo_adjunto', 'U') IS NOT NULL DROP TABLE archivo_adjunto;
IF OBJECT_ID('revision_campo_solicitud', 'U') IS NOT NULL DROP TABLE revision_campo_solicitud;
IF OBJECT_ID('sustancia_solicitud', 'U') IS NOT NULL DROP TABLE sustancia_solicitud;
IF OBJECT_ID('historial_estado_solicitud', 'U') IS NOT NULL DROP TABLE historial_estado_solicitud;
IF OBJECT_ID('solicitud', 'U') IS NOT NULL DROP TABLE solicitud;
IF OBJECT_ID('estado_solicitud_catalogo', 'U') IS NOT NULL DROP TABLE estado_solicitud_catalogo;
IF OBJECT_ID('tipo_tramite', 'U') IS NOT NULL DROP TABLE tipo_tramite;
IF OBJECT_ID('tipo_servicio', 'U') IS NOT NULL DROP TABLE tipo_servicio;
IF OBJECT_ID('sustancia_controlada', 'U') IS NOT NULL DROP TABLE sustancia_controlada;
IF OBJECT_ID('categoria_droga', 'U') IS NOT NULL DROP TABLE categoria_droga;
IF OBJECT_ID('empleado', 'U') IS NOT NULL DROP TABLE empleado;
IF OBJECT_ID('contacto_establecimiento', 'U') IS NOT NULL DROP TABLE contacto_establecimiento;
IF OBJECT_ID('actividad_establecimiento', 'U') IS NOT NULL DROP TABLE actividad_establecimiento;
IF OBJECT_ID('establecimiento', 'U') IS NOT NULL DROP TABLE establecimiento;
IF OBJECT_ID('profesional', 'U') IS NOT NULL DROP TABLE profesional;
IF OBJECT_ID('solicitante', 'U') IS NOT NULL DROP TABLE solicitante;

-- ====================================================================================
-- 1. USUARIOS Y AUTENTICACIÓN
-- ====================================================================================

-- Tabla base de SOLICITANTE (usuario externo)
CREATE TABLE solicitante (
    id_solicitante INT IDENTITY(1,1) PRIMARY KEY,
    tipo_solicitante VARCHAR(50) NOT NULL, -- 'PROFESIONAL', 'ESTABLECIMIENTO_PRIVADO', 'INSTITUCION_PUBLICA', 'IMPORTADORA'
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    estado_cuenta VARCHAR(20) DEFAULT 'ACTIVA', -- 'ACTIVA', 'INACTIVA', 'SUSPENDIDA'
    fecha_registro DATETIME DEFAULT GETDATE(),
    fecha_ultimo_acceso DATETIME,
    email_confirmado BIT NOT NULL DEFAULT 0,
    token_confirmacion VARCHAR(128),
    token_confirmacion_expira DATETIME,
    token_reset_password VARCHAR(128),
    token_reset_expira DATETIME,
    CONSTRAINT ck_tipo_solicitante CHECK (tipo_solicitante IN ('PROFESIONAL', 'ESTABLECIMIENTO_PRIVADO', 'INSTITUCION_PUBLICA', 'IMPORTADORA'))
);

-- Tabla de registros pendientes de solicitante (para confirmar email antes de crear cuenta)
CREATE TABLE solicitante_registro_pendiente (
    id_registro INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    datos_payload NVARCHAR(MAX) NOT NULL,
    token_confirmacion VARCHAR(128) NOT NULL UNIQUE,
    expira DATETIME NOT NULL,
    creado_en DATETIME DEFAULT GETDATE()
);

-- Tabla de PROFESIONAL (persona natural)
CREATE TABLE profesional (
    id_profesional INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitante INT UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula_identidad VARCHAR(20) UNIQUE NOT NULL,
    cedula_electoral VARCHAR(20),
    exequatur VARCHAR(100),
    profesion VARCHAR(100) NOT NULL, -- 'MEDICINA', 'MEDICINA_VETERINARIA', 'ODONTOLOGIA', 'OTRA'
    numero_colegiatura VARCHAR(100),
    codigo_colegio VARCHAR(100),
    direccion_postal VARCHAR(500),
    telefono_residencial VARCHAR(20),
    telefono_celular VARCHAR(20),
    lugar_trabajo VARCHAR(255),
    email_trabajo VARCHAR(255),
    direccion_trabajo VARCHAR(500),
    telefono_trabajo VARCHAR(20),
    fecha_nacimiento DATE,
    FOREIGN KEY (id_solicitante) REFERENCES solicitante(id_solicitante) ON DELETE CASCADE,
    CONSTRAINT ck_profesion CHECK (profesion IN ('MEDICINA', 'MEDICINA_VETERINARIA', 'ODONTOLOGIA', 'OTRA'))
);

-- Tabla de ESTABLECIMIENTO (empresa/entidad)
CREATE TABLE establecimiento (
    id_establecimiento INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitante INT UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    rnc VARCHAR(20) UNIQUE NOT NULL,
    direccion_postal VARCHAR(500),
    email_empresa VARCHAR(255),
    telefono_empresa VARCHAR(20),
    tipo_entidad VARCHAR(50) NOT NULL, -- 'PRIVADA', 'PUBLICA'
    estado_empresa VARCHAR(20) DEFAULT 'ACTIVA',
    fecha_constitucion DATE,
    FOREIGN KEY (id_solicitante) REFERENCES solicitante(id_solicitante) ON DELETE CASCADE,
    CONSTRAINT ck_tipo_entidad CHECK (tipo_entidad IN ('PRIVADA', 'PUBLICA'))
);

-- Tabla de ACTIVIDADES del establecimiento (1:N)
CREATE TABLE actividad_establecimiento (
    id_actividad INT IDENTITY(1,1) PRIMARY KEY,
    id_establecimiento INT NOT NULL,
    tipo_actividad VARCHAR(50) NOT NULL,
    -- 'IMPORTADORA', 'EXPORTADORA', 'FABRICANTE', 'DISTRIBUIDOR', 'LABORATORIO_ANALITICO',
    -- 'FARMACIA', 'CLINICA_PRIVADA', 'CLINICA_VETERINARIA', 'INSTITUCION_ENSEÑANZA',
    -- 'HOSPITAL_PUBLICO', 'INVESTIGACION_CAT_I', 'OTRA'
    descripcion_otra VARCHAR(500),
    fecha_registro DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_establecimiento) REFERENCES establecimiento(id_establecimiento) ON DELETE CASCADE
);

-- Tabla de CONTACTOS ASOCIADOS (Regente Farmacéutico, Administrador, Agente Aduanero)
CREATE TABLE contacto_establecimiento (
    id_contacto INT IDENTITY(1,1) PRIMARY KEY,
    id_establecimiento INT NOT NULL,
    tipo_contacto VARCHAR(50) NOT NULL, -- 'REGENTE_FARMACEUTICO', 'ADMINISTRADOR', 'AGENTE_ADUANERO'
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(20),
    rnc VARCHAR(20),
    direccion VARCHAR(500),
    telefono VARCHAR(20),
    email VARCHAR(255),
    otro_lugar_trabajo VARCHAR(255),
    exequatur VARCHAR(100),
    FOREIGN KEY (id_establecimiento) REFERENCES establecimiento(id_establecimiento) ON DELETE CASCADE,
    CONSTRAINT ck_tipo_contacto CHECK (tipo_contacto IN ('REGENTE_FARMACEUTICO', 'ADMINISTRADOR', 'AGENTE_ADUANERO'))
);

-- Tabla de EMPLEADO (usuario interno)
CREATE TABLE empleado (
    id_empleado INT IDENTITY(1,1) PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL, -- 'VENTANILLA', 'TECNICO_UPC', 'ENCARGADO_UPC', 'DIRECCION', 'DNCD', 'ADMIN'
    departamento VARCHAR(100),
    estado_empleado VARCHAR(20) DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'
    fecha_ingreso DATE,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    email_confirmado BIT NOT NULL DEFAULT 0,
    token_confirmacion VARCHAR(128),
    token_confirmacion_expira DATETIME,
    token_reset_password VARCHAR(128),
    token_reset_expira DATETIME,
    password_temporal BIT NOT NULL DEFAULT 0,
    CONSTRAINT ck_rol CHECK (rol IN ('VENTANILLA', 'TECNICO_UPC', 'ENCARGADO_UPC', 'DIRECCION', 'DNCD', 'ADMIN'))
);

-- ====================================================================================
-- 2. CATÁLOGOS DEL SISTEMA
-- ====================================================================================

-- Tabla de CATEGORÍA DE DROGA
CREATE TABLE categoria_droga (
    id_categoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    numero_categoria INT UNIQUE -- Clase A, Clase B, Clase C
);

-- Tabla de SUSTANCIA CONTROLADA
CREATE TABLE sustancia_controlada (
    id_sustancia INT IDENTITY(1,1) PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre_cientifico VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    codigo_sustancia VARCHAR(50) UNIQUE NOT NULL,
    formula_quimica VARCHAR(100),
    peso_molecular DECIMAL(10,4),
    nivel_restriccion INT, -- 1 (muy controlado) a 5 (menos controlado)
    requiere_licencia_importacion BIT DEFAULT 1,
    requiere_licencia_uso BIT DEFAULT 1,
    estado_sustancia VARCHAR(20) DEFAULT 'ACTIVA',
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_categoria) REFERENCES categoria_droga(id_categoria),
    CONSTRAINT ck_restriccion CHECK (nivel_restriccion BETWEEN 1 AND 5)
);

-- Tabla de TIPO DE SERVICIO
CREATE TABLE tipo_servicio (
    id_tipo_servicio INT IDENTITY(1,1) PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(500),
    requiere_costo_administrativo BIT DEFAULT 1,
    costo_administrativo DECIMAL(10,2),
    dias_respuesta INT DEFAULT 10,
    estado_servicio VARCHAR(20) DEFAULT 'ACTIVO'
);

-- Tabla de TIPO DE TRÁMITE
CREATE TABLE tipo_tramite (
    id_tipo_tramite INT IDENTITY(1,1) PRIMARY KEY,
    id_tipo_servicio INT NOT NULL,
    nombre_tramite VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    requiere_costo BIT DEFAULT 1,
    costo_tramite DECIMAL(10,2),
    campos_obligatorios VARCHAR(MAX), -- JSON string de campos requeridos
    FOREIGN KEY (id_tipo_servicio) REFERENCES tipo_servicio(id_tipo_servicio) ON DELETE CASCADE
);

-- Tabla CATÁLOGO de ESTADOS DE SOLICITUD
CREATE TABLE estado_solicitud_catalogo (
    id_estado INT IDENTITY(1,1) PRIMARY KEY,
    nombre_estado VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    es_estado_inicial BIT DEFAULT 0,
    es_estado_final BIT DEFAULT 0,
    orden_secuencial INT
);

-- ====================================================================================
-- 3. SOLICITUDES Y TRÁMITES
-- ====================================================================================

-- Tabla PRINCIPAL de SOLICITUD
CREATE TABLE solicitud (
    id_solicitud INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitante INT NOT NULL,
    id_tipo_servicio INT NOT NULL,
    id_tipo_tramite INT NOT NULL,
    numero_expediente VARCHAR(50) UNIQUE,
    numero_solicitud VARCHAR(50) NOT NULL UNIQUE DEFAULT (
        'SOL-' + CONVERT(VARCHAR(8), GETDATE(), 112) + '-' + RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6)
    ),
    estado_solicitud VARCHAR(50) NOT NULL DEFAULT 'CREADA',
    prioridad VARCHAR(20) DEFAULT 'NORMAL', -- 'BAJA', 'NORMAL', 'ALTA', 'URGENTE'
    fecha_creacion DATETIME DEFAULT GETDATE(),
    fecha_actualizacion DATETIME DEFAULT GETDATE(),
    fecha_vencimiento DATE,
    fecha_envio_datos DATETIME,
    comentario_general VARCHAR(MAX),
    numero_cidc_anterior NVARCHAR(50),
    motivo_detalle NVARCHAR(MAX),
    datos_servicio_json NVARCHAR(MAX),
    documentos_reportados_json NVARCHAR(MAX),
    resumen_pago_label NVARCHAR(150),
    monto_total_reportado DECIMAL(12,2),
    id_empleado_asignado INT,
    FOREIGN KEY (id_solicitante) REFERENCES solicitante(id_solicitante) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_servicio) REFERENCES tipo_servicio(id_tipo_servicio),
    FOREIGN KEY (id_tipo_tramite) REFERENCES tipo_tramite(id_tipo_tramite),
    FOREIGN KEY (id_empleado_asignado) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    CONSTRAINT ck_estado_solicitud CHECK (estado_solicitud IN (
        'CREADA', 'REGISTRADA', 'EN_VENTANILLA', 'DEVUELTA_VENTANILLA', 'VALIDADA',
        'EN_REVISION_UPC', 'EN_ENCARGADO_UPC', 'EN_UPC', 'DEVUELTA_UPC', 'EN_DIRECCION', 'DEVUELTA_DIRECCION',
        'EN_DNCD', 'DEVUELTA_DNCD', 'PENDIENTE_PAGO', 'PAGO_CONFIRMADO', 'APROBADA',
        'RECHAZADA', 'RESOLUCION_EMITIDA', 'CERTIFICADO_EMITIDO', 'COMPLETADA', 'DENEGADA'
    )),
    CONSTRAINT ck_prioridad CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE'))
);

-- Tabla de HISTORIAL DE CAMBIOS DE ESTADO
CREATE TABLE historial_estado_solicitud (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    id_empleado_cambio INT,
    fecha_cambio DATETIME DEFAULT GETDATE(),
    motivo_cambio VARCHAR(MAX),
    comentario_adicional VARCHAR(MAX),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado_cambio) REFERENCES empleado(id_empleado) ON DELETE SET NULL
);

-- Tabla de REVISIÓN DE CAMPOS POR SOLICITUD
CREATE TABLE revision_campo_solicitud (
    id_revision INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    nombre_campo VARCHAR(100) NOT NULL,
    etiqueta_campo VARCHAR(255),
    valor_reportado VARCHAR(MAX),
    estado_campo VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'CUMPLE', 'OBSERVADO'
    comentario_revision VARCHAR(MAX),
    id_empleado_revision INT,
    fecha_revision DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado_revision) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    CONSTRAINT ck_estado_campo_revision CHECK (estado_campo IN ('PENDIENTE', 'CUMPLE', 'OBSERVADO')),
    CONSTRAINT uq_revision_campo UNIQUE (id_solicitud, nombre_campo)
);

-- Tabla de SUSTANCIAS en SOLICITUD (N:M)
CREATE TABLE sustancia_solicitud (
    id_sustancia_solicitud INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    id_sustancia INT NOT NULL,
    cantidad_solicitada DECIMAL(12,3),
    unidad_medida VARCHAR(20), -- 'GRAMO', 'KILOGRAMO', 'MILILITRO', 'LITRO', etc.
    especificacion_uso VARCHAR(500),
    proveedor VARCHAR(255),
    pais_origen VARCHAR(100),
    fecha_agregacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_sustancia) REFERENCES sustancia_controlada(id_sustancia)
);

-- ====================================================================================
-- 4. DOCUMENTOS Y ARCHIVOS
-- ====================================================================================

-- Tabla de ARCHIVO ADJUNTO
CREATE TABLE archivo_adjunto (
    id_archivo INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50) NOT NULL, -- 'CEDULA', 'TITULO_PROFESIONAL', 'LICENCIA_SANITARIA', etc.
    ruta_almacenamiento VARCHAR(500) NOT NULL,
    tamano_bytes INT,
    mime_type VARCHAR(50),
    hash_sha256 VARCHAR(64),
    estado_archivo VARCHAR(50) DEFAULT 'PENDIENTE_REVISION', -- 'PENDIENTE_REVISION', 'CUMPLE', 'NO_CUMPLE', 'RECHAZADO'
    comentario_revision VARCHAR(MAX),
    id_empleado_revision INT,
    fecha_revision DATETIME,
    fecha_carga DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado_revision) REFERENCES empleado(id_empleado) ON DELETE SET NULL
);

-- ====================================================================================
-- 5. PAGOS Y COBROS
-- ====================================================================================

-- Tabla de PAGO
CREATE TABLE pago (
    id_pago INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    monto_costo_administrativo DECIMAL(10,2),
    monto_tramite DECIMAL(10,2),
    estado_pago VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'REEMBOLSO'
    fecha_vencimiento DATE,
    forma_pago VARCHAR(50), -- 'TRANSFERENCIA', 'CHEQUE', 'DEPOSITO', 'OTRO'
    referencia_pago VARCHAR(100),
    numero_comprobante VARCHAR(50),
    id_empleado_verificador INT,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    fecha_confirmacion DATETIME,
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado_verificador) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    CONSTRAINT ck_estado_pago CHECK (estado_pago IN ('PENDIENTE', 'CONFIRMADO', 'RECHAZADO', 'REEMBOLSO'))
);

-- ====================================================================================
-- 6. CERTIFICADOS Y DOCUMENTOS EMITIDOS
-- ====================================================================================

-- Tabla de CERTIFICADO EMITIDO
CREATE TABLE certificado_emitido (
    id_certificado INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT UNIQUE NOT NULL,
    numero_certificado VARCHAR(50) UNIQUE NOT NULL,
    num_resolucion VARCHAR(100),
    tipo_certificado VARCHAR(50) NOT NULL, -- 'CIDC_CLASE_A', 'CIDC_CLASE_B', 'PERMISO_IMPORTACION', etc.
    fecha_emision DATETIME DEFAULT GETDATE(),
    fecha_vencimiento DATE,
    estado_certificado VARCHAR(20) DEFAULT 'ACTIVO', -- 'ACTIVO', 'VENCIDO', 'REVOCADO', 'CANCELADO'
    ruta_pdf VARCHAR(500),
    ruta_pdf_firmado VARCHAR(500),
    hash_pdf VARCHAR(64),
    firma_digital_certificado VARCHAR(MAX), -- Firma en formato Base64 o similar
    id_empleado_firma INT,
    fecha_firma DATETIME,
    datos_certificado VARCHAR(MAX), -- JSON con datos del certificado
    observaciones VARCHAR(MAX),
    FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
    FOREIGN KEY (id_empleado_firma) REFERENCES empleado(id_empleado) ON DELETE SET NULL,
    CONSTRAINT ck_estado_certificado CHECK (estado_certificado IN ('ACTIVO', 'VENCIDO', 'REVOCADO', 'CANCELADO'))
);

GO
CREATE VIEW certificado AS
SELECT
    id_certificado,
    id_solicitud,
    ISNULL(num_resolucion, numero_certificado) AS num_resolucion,
    fecha_emision,
    estado_certificado AS estado
FROM certificado_emitido;
GO

-- ====================================================================================
-- 7. AUDITORÍA Y LOGGING
-- ====================================================================================

-- Tabla de AUDITORÍA DE CAMBIOS
CREATE TABLE auditoria_cambios (
    id_auditoria INT IDENTITY(1,1) PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro INT,
    tipo_operacion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    valores_anteriores VARCHAR(MAX),
    valores_nuevos VARCHAR(MAX),
    id_usuario INT,
    tipo_usuario VARCHAR(20), -- 'SOLICITANTE', 'EMPLEADO'
    fecha_operacion DATETIME DEFAULT GETDATE(),
    ip_origen VARCHAR(45),
    navegador_user_agent VARCHAR(500),
    CONSTRAINT ck_tipo_operacion CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Tabla de LOG DE ACCESO AL SISTEMA
CREATE TABLE log_acceso_sistema (
    id_log INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    tipo_usuario VARCHAR(20), -- 'SOLICITANTE', 'EMPLEADO'
    email_usuario VARCHAR(255),
    fecha_acceso DATETIME DEFAULT GETDATE(),
    tipo_acceso VARCHAR(50), -- 'LOGIN', 'LOGOUT', 'ACCESO_PAGINA', 'ERROR_AUTENTICACION'
    ip_origen VARCHAR(45),
    navegador_user_agent VARCHAR(500),
    resultado VARCHAR(20) DEFAULT 'EXITOSO', -- 'EXITOSO', 'FALLIDO'
    motivo_fallo VARCHAR(500),
    CONSTRAINT ck_tipo_acceso CHECK (tipo_acceso IN ('LOGIN', 'LOGOUT', 'ACCESO_PAGINA', 'ERROR_AUTENTICACION'))
);

-- ====================================================================================
-- 8. ÍNDICES PARA OPTIMIZACIÓN
-- ====================================================================================

-- Índices en SOLICITANTE
CREATE INDEX idx_solicitante_email ON solicitante(email);
CREATE INDEX idx_solicitante_estado ON solicitante(estado_cuenta);
CREATE INDEX idx_solicitante_tipo ON solicitante(tipo_solicitante);
CREATE INDEX idx_solicitante_token_confirmacion ON solicitante(token_confirmacion);
CREATE INDEX idx_solicitante_token_reset ON solicitante(token_reset_password);

-- Índices en PROFESIONAL
CREATE INDEX idx_profesional_cedula ON profesional(cedula_identidad);
CREATE INDEX idx_profesional_id_solicitante ON profesional(id_solicitante);

-- Índices en ESTABLECIMIENTO
CREATE INDEX idx_establecimiento_rnc ON establecimiento(rnc);
CREATE INDEX idx_establecimiento_id_solicitante ON establecimiento(id_solicitante);

-- Índices en EMPLEADO
CREATE INDEX idx_empleado_email ON empleado(email);
CREATE INDEX idx_empleado_rol ON empleado(rol);
CREATE INDEX idx_empleado_estado ON empleado(estado_empleado);
CREATE INDEX idx_empleado_token_confirmacion ON empleado(token_confirmacion);
CREATE INDEX idx_empleado_token_reset ON empleado(token_reset_password);

-- Índices en SOLICITUD (críticos para búsquedas)
CREATE INDEX idx_solicitud_id_solicitante ON solicitud(id_solicitante);
CREATE INDEX idx_solicitud_estado ON solicitud(estado_solicitud);
CREATE INDEX idx_solicitud_id_tipo_servicio ON solicitud(id_tipo_servicio);
CREATE INDEX idx_solicitud_fecha_creacion ON solicitud(fecha_creacion);
CREATE INDEX idx_solicitud_id_empleado_asignado ON solicitud(id_empleado_asignado);
CREATE INDEX idx_solicitud_prioridad ON solicitud(prioridad);
CREATE INDEX idx_solicitud_numero ON solicitud(numero_solicitud);
CREATE UNIQUE INDEX idx_solicitud_numero_expediente ON solicitud(numero_expediente) WHERE numero_expediente IS NOT NULL;

-- Índices en HISTORIAL_ESTADO_SOLICITUD
CREATE INDEX idx_historial_id_solicitud ON historial_estado_solicitud(id_solicitud);
CREATE INDEX idx_historial_fecha_cambio ON historial_estado_solicitud(fecha_cambio);
CREATE INDEX idx_historial_id_empleado ON historial_estado_solicitud(id_empleado_cambio);

-- Índices en ARCHIVO_ADJUNTO
CREATE INDEX idx_archivo_id_solicitud ON archivo_adjunto(id_solicitud);
CREATE INDEX idx_archivo_estado ON archivo_adjunto(estado_archivo);
CREATE INDEX idx_archivo_tipo ON archivo_adjunto(tipo_archivo);
CREATE INDEX idx_archivo_fecha_carga ON archivo_adjunto(fecha_carga);

-- Índices en PAGO
CREATE INDEX idx_pago_id_solicitud ON pago(id_solicitud);
CREATE INDEX idx_pago_estado ON pago(estado_pago);
CREATE INDEX idx_pago_fecha_creacion ON pago(fecha_creacion);

-- Índices en CERTIFICADO_EMITIDO
CREATE INDEX idx_certificado_id_solicitud ON certificado_emitido(id_solicitud);
CREATE INDEX idx_certificado_numero ON certificado_emitido(numero_certificado);
CREATE INDEX idx_certificado_estado ON certificado_emitido(estado_certificado);
CREATE INDEX idx_certificado_tipo ON certificado_emitido(tipo_certificado);

-- Índices en AUDITORIA
CREATE INDEX idx_auditoria_tabla ON auditoria_cambios(tabla_afectada);
CREATE INDEX idx_auditoria_fecha ON auditoria_cambios(fecha_operacion);
CREATE INDEX idx_auditoria_usuario ON auditoria_cambios(id_usuario);

-- Índices en LOG
CREATE INDEX idx_log_usuario ON log_acceso_sistema(id_usuario);
CREATE INDEX idx_log_fecha ON log_acceso_sistema(fecha_acceso);
CREATE INDEX idx_log_tipo_acceso ON log_acceso_sistema(tipo_acceso);

-- ====================================================================================
-- 9. INSERCIÓN DE DATOS INICIALES
-- ====================================================================================

-- CATEGORÍAS DE DROGAS
INSERT INTO categoria_droga (nombre_categoria, descripcion, numero_categoria)
VALUES 
    ('Clase A', 'Sustancias sumamente controladas', 1),
    ('Clase B', 'Sustancias controladas', 2),
    ('Clase C', 'Sustancias moderadamente controladas', 3),
    ('Clase D', 'Sustancias con control especial', 4);

-- ESTADOS DE SOLICITUD
INSERT INTO estado_solicitud_catalogo (nombre_estado, descripcion, es_estado_inicial, es_estado_final, orden_secuencial)
VALUES
    ('CREADA', 'Solicitud recién creada', 1, 0, 1),
    ('REGISTRADA', 'Registrada por ventanilla', 0, 0, 2),
    ('EN_VENTANILLA', 'En revisión por Ventanilla Única', 0, 0, 3),
    ('DEVUELTA_VENTANILLA', 'Devuelta por Ventanilla para completar documentos', 0, 0, 4),
    ('VALIDADA', 'Validada en ventanilla', 0, 0, 5),
    ('EN_REVISION_UPC', 'En revisión técnica UPC', 0, 0, 6),
    ('EN_ENCARGADO_UPC', 'Revisión final por encargado UPC', 0, 0, 7),
    ('EN_UPC', 'En evaluación técnica UPC', 0, 0, 8),
    ('DEVUELTA_UPC', 'Devuelta por UPC para aclaraciones', 0, 0, 9),
    ('EN_DIRECCION', 'En aprobación de Dirección', 0, 0, 10),
    ('DEVUELTA_DIRECCION', 'Devuelta por Dirección', 0, 0, 11),
    ('EN_DNCD', 'En revisión final DNCD', 0, 0, 12),
    ('DEVUELTA_DNCD', 'Devuelta por DNCD', 0, 0, 13),
    ('PENDIENTE_PAGO', 'Pendiente confirmación de pago', 0, 0, 14),
    ('PAGO_CONFIRMADO', 'Pago confirmado', 0, 0, 15),
    ('APROBADA', 'Solicitud aprobada', 0, 1, 16),
    ('RECHAZADA', 'Solicitud rechazada', 0, 1, 17),
    ('RESOLUCION_EMITIDA', 'Resolución emitida', 0, 1, 18),
    ('CERTIFICADO_EMITIDO', 'Certificado o permiso emitido', 0, 1, 19),
    ('COMPLETADA', 'Trámite completado exitosamente', 0, 1, 20),
    ('DENEGADA', 'Solicitud denegada', 0, 1, 21);

-- TIPOS DE SERVICIO
INSERT INTO tipo_servicio (nombre_servicio, descripcion, requiere_costo_administrativo, costo_administrativo, dias_respuesta, estado_servicio)
VALUES
    ('CIDC Clase A', 'Certificado de Inscripción de Drogas Controladas Clase A para profesionales', 1, 500.00, 15, 'ACTIVO'),
    ('CIDC Clase B', 'Certificado de Inscripción de Drogas Controladas Clase B para establecimientos', 1, 750.00, 20, 'ACTIVO'),
    ('Permiso Importación Materia Prima', 'Permiso para importación de materia prima de sustancias controladas', 1, 1000.00, 30, 'ACTIVO'),
    ('Permiso Importación Medicamentos', 'Permiso para importación de medicamentos con sustancias controladas', 1, 1000.00, 30, 'ACTIVO'),
    ('Solicitud Renovación', 'Renovación de certificados o permisos vigentes', 1, 300.00, 10, 'ACTIVO');

-- TIPOS DE TRÁMITE (catálogo base por tipo de servicio)
INSERT INTO tipo_tramite (id_tipo_servicio, nombre_tramite, descripcion, requiere_costo, costo_tramite, campos_obligatorios)
SELECT
    ts.id_tipo_servicio,
    tt.nombre_tramite,
    CONCAT(tt.descripcion, ' - ', ts.nombre_servicio) AS descripcion,
    tt.requiere_costo,
    tt.costo_tramite,
    NULL
FROM tipo_servicio ts
CROSS JOIN (
    VALUES
        ('Nueva solicitud', 'Registro inicial del servicio', 1, NULL),
        ('Renovación', 'Renovación de un certificado vigente', 1, NULL),
        ('Solicitud anterior negada', 'Reingreso luego de una negación previa', 0, NULL),
        ('Certificado reprobado/suspendido', 'Emisión tras correcciones de un certificado detenido', 0, NULL)
) AS tt(nombre_tramite, descripcion, requiere_costo, costo_tramite);

-- Ejemplo de sustancias controladas
INSERT INTO sustancia_controlada (id_categoria, nombre_cientifico, nombre_comercial, codigo_sustancia, formula_quimica, peso_molecular, nivel_restriccion, requiere_licencia_importacion, requiere_licencia_uso, estado_sustancia)
VALUES
    (1, 'Cocaína', 'Cocaína HCl', 'SUB001', 'C17H21NO4', 303.35, 1, 1, 1, 'ACTIVA'),
    (1, 'Codeína', 'Codeína Fosfato', 'SUB002', 'C18H21NO3·H3PO4', 399.36, 2, 1, 1, 'ACTIVA'),
    (2, 'Meperidina', 'Demerol', 'SUB003', 'C15H23NO2', 247.36, 2, 1, 1, 'ACTIVA'),
    (2, 'Diazepam', 'Valium', 'SUB004', 'C16H13ClN2O', 284.74, 2, 0, 1, 'ACTIVA'),
    (3, 'Ibuprofeno', 'Actron', 'SUB005', 'C13H18O2', 206.28, 5, 0, 0, 'ACTIVA');

-- ====================================================================================
-- 10. CONSTRAINTS Y REGLAS DE NEGOCIO
-- ====================================================================================

-- Constraint: Email único en solicitante
ALTER TABLE solicitante ADD CONSTRAINT uq_solicitante_email UNIQUE (email);

-- Constraint: Email único en empleado
ALTER TABLE empleado ADD CONSTRAINT uq_empleado_email UNIQUE (email);

-- Constraint: Cédula única en profesional
ALTER TABLE profesional ADD CONSTRAINT uq_profesional_cedula UNIQUE (cedula_identidad);

-- Constraint: RNC único en establecimiento
ALTER TABLE establecimiento ADD CONSTRAINT uq_establecimiento_rnc UNIQUE (rnc);

-- ====================================================================================
-- 11. PROCEDIMIENTOS ALMACENADOS
-- ====================================================================================

IF OBJECT_ID('dbo.sp_sync_estado_solicitud', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_sync_estado_solicitud;
GO

CREATE PROCEDURE dbo.sp_sync_estado_solicitud
    @EstadosJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF @EstadosJson IS NULL OR LTRIM(RTRIM(@EstadosJson)) = ''
    BEGIN
        THROW 50001, 'El parámetro @EstadosJson es obligatorio.', 1;
    END;

    DECLARE @Estados TABLE (
        nombre_estado NVARCHAR(50) NOT NULL,
        descripcion NVARCHAR(255),
        es_inicial BIT NOT NULL,
        es_final BIT NOT NULL,
        orden INT NOT NULL
    );

    INSERT INTO @Estados (nombre_estado, descripcion, es_inicial, es_final, orden)
    SELECT
        nombre_estado,
        descripcion,
        es_inicial,
        es_final,
        orden
    FROM OPENJSON(@EstadosJson)
    WITH (
        nombre_estado NVARCHAR(50) '$.nombre_estado',
        descripcion NVARCHAR(255) '$.descripcion',
        es_inicial BIT '$.es_inicial',
        es_final BIT '$.es_final',
        orden INT '$.orden'
    );

    IF NOT EXISTS (SELECT 1 FROM @Estados)
    BEGIN
        THROW 50002, 'No se recibieron estados para sincronizar.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM @Estados
        WHERE nombre_estado IS NULL OR LTRIM(RTRIM(nombre_estado)) = ''
    )
    BEGIN
        THROW 50003, 'Todos los estados requieren un nombre válido.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        MERGE estado_solicitud_catalogo AS target
        USING @Estados AS source
            ON target.nombre_estado = source.nombre_estado
        WHEN MATCHED THEN
            UPDATE SET
                descripcion = source.descripcion,
                es_estado_inicial = source.es_inicial,
                es_estado_final = source.es_final,
                orden_secuencial = source.orden
        WHEN NOT MATCHED THEN
            INSERT (nombre_estado, descripcion, es_estado_inicial, es_estado_final, orden_secuencial)
            VALUES (source.nombre_estado, source.descripcion, source.es_inicial, source.es_final, source.orden);

        DECLARE @EstadosCsv NVARCHAR(MAX);

        SELECT @EstadosCsv =
            STUFF((
                SELECT ',''' + nombre_estado + ''''
                FROM @Estados
                ORDER BY orden, nombre_estado
                FOR XML PATH(''), TYPE
            ).value('.', 'NVARCHAR(MAX)'), 1, 1, '');

        IF @EstadosCsv IS NULL OR LEN(@EstadosCsv) = 0
        BEGIN
            THROW 50004, 'No se pudo construir la lista de estados para la restricción.', 1;
        END;

        IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_estado_solicitud')
        BEGIN
            ALTER TABLE solicitud DROP CONSTRAINT ck_estado_solicitud;
        END;

        DECLARE @ConstraintSql NVARCHAR(MAX) =
            N'ALTER TABLE solicitud ADD CONSTRAINT ck_estado_solicitud CHECK (estado_solicitud IN (' + @EstadosCsv + N'));';

        EXEC sp_executesql @ConstraintSql;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.sp_upsert_admin_empleado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_upsert_admin_empleado;
GO

CREATE PROCEDURE dbo.sp_upsert_admin_empleado
    @Nombre NVARCHAR(255),
    @Cedula NVARCHAR(20),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Departamento NVARCHAR(100),
    @EmpleadoId INT OUTPUT,
    @FueActualizado BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Email IS NULL OR LTRIM(RTRIM(@Email)) = ''
    BEGIN
        THROW 60001, 'El correo institucional es obligatorio.', 1;
    END;

    IF @PasswordHash IS NULL OR LEN(@PasswordHash) < 8
    BEGIN
        THROW 60002, 'El hash de la contraseña no es válido.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @EmpleadoId = id_empleado
        FROM empleado
        WHERE email = @Email;

        IF @EmpleadoId IS NOT NULL
        BEGIN
            UPDATE empleado
            SET nombre_completo = @Nombre,
                cedula = @Cedula,
                departamento = @Departamento,
                password_hash = @PasswordHash,
                rol = 'ADMIN',
                estado_empleado = 'ACTIVO'
            WHERE id_empleado = @EmpleadoId;

            SET @FueActualizado = 1;
        END
        ELSE
        BEGIN
            INSERT INTO empleado (
                nombre_completo,
                cedula,
                email,
                password_hash,
                rol,
                departamento,
                estado_empleado,
                fecha_ingreso,
                fecha_creacion
            )
            VALUES (
                @Nombre,
                @Cedula,
                @Email,
                @PasswordHash,
                'ADMIN',
                @Departamento,
                'ACTIVO',
                GETDATE(),
                GETDATE()
            );

            SET @EmpleadoId = SCOPE_IDENTITY();
            SET @FueActualizado = 0;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;

    SELECT @EmpleadoId AS id_empleado, @FueActualizado AS fue_actualizado;
END;
GO

IF OBJECT_ID('dbo.sp_seed_catalogos_basicos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_seed_catalogos_basicos;
GO

CREATE PROCEDURE dbo.sp_seed_catalogos_basicos
    @ServiciosJson NVARCHAR(MAX),
    @TramitesJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    IF (@ServiciosJson IS NULL OR LTRIM(RTRIM(@ServiciosJson)) = '')
    BEGIN
        THROW 61001, 'El parámetro @ServiciosJson es obligatorio.', 1;
    END;

    IF (@TramitesJson IS NULL OR LTRIM(RTRIM(@TramitesJson)) = '')
    BEGIN
        THROW 61002, 'El parámetro @TramitesJson es obligatorio.', 1;
    END;

    DECLARE @Servicios TABLE (
        nombre_servicio NVARCHAR(100) PRIMARY KEY,
        descripcion NVARCHAR(500),
        dias_respuesta INT
    );

    INSERT INTO @Servicios (nombre_servicio, descripcion, dias_respuesta)
    SELECT nombre, descripcion, dias
    FROM OPENJSON(@ServiciosJson)
    WITH (
        nombre NVARCHAR(100) '$.nombre_servicio',
        descripcion NVARCHAR(500) '$.descripcion',
        dias INT '$.dias_respuesta'
    );

    IF NOT EXISTS (SELECT 1 FROM @Servicios)
    BEGIN
        THROW 61003, 'No se recibieron tipos de servicio válidos.', 1;
    END;

    DECLARE @Tramites TABLE (
        nombre_tramite NVARCHAR(100) PRIMARY KEY,
        descripcion NVARCHAR(500),
        requiere_costo BIT,
        costo_tramite DECIMAL(10,2),
        campos_obligatorios NVARCHAR(MAX),
        nombre_servicio NVARCHAR(100)
    );

    INSERT INTO @Tramites (nombre_tramite, descripcion, requiere_costo, costo_tramite, campos_obligatorios, nombre_servicio)
    SELECT nombre, descripcion, requiere_costo, costo, campos_obligatorios, servicio_nombre
    FROM OPENJSON(@TramitesJson)
    WITH (
        nombre NVARCHAR(100) '$.nombre_tramite',
        descripcion NVARCHAR(500) '$.descripcion',
        requiere_costo BIT '$.requiere_costo',
        costo DECIMAL(10,2) '$.costo_tramite',
        campos_obligatorios NVARCHAR(MAX) '$.campos_obligatorios',
        servicio_nombre NVARCHAR(100) '$.servicio_nombre'
    );

    IF NOT EXISTS (SELECT 1 FROM @Tramites)
    BEGIN
        THROW 61004, 'No se recibieron tipos de trámite válidos.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        MERGE tipo_servicio AS target
        USING @Servicios AS source
            ON target.nombre_servicio = source.nombre_servicio
        WHEN MATCHED THEN
            UPDATE SET
                target.descripcion = source.descripcion,
                target.dias_respuesta = source.dias_respuesta,
                target.estado_servicio = COALESCE(target.estado_servicio, 'ACTIVO')
        WHEN NOT MATCHED THEN
            INSERT (nombre_servicio, descripcion, dias_respuesta, estado_servicio)
            VALUES (source.nombre_servicio, source.descripcion, source.dias_respuesta, 'ACTIVO');

        IF EXISTS (
            SELECT 1
            FROM @Tramites t
            LEFT JOIN tipo_servicio ts ON ts.nombre_servicio = t.nombre_servicio
            WHERE ts.id_tipo_servicio IS NULL
        )
        BEGIN
            THROW 61005, 'Algún tipo de servicio referenciado por un trámite no existe.', 1;
        END;

        ;WITH TramitesConServicio AS (
            SELECT
                t.nombre_tramite,
                t.descripcion,
                t.requiere_costo,
                t.costo_tramite,
                t.campos_obligatorios,
                ts.id_tipo_servicio
            FROM @Tramites t
            INNER JOIN tipo_servicio ts ON ts.nombre_servicio = t.nombre_servicio
        )
        MERGE tipo_tramite AS target
        USING TramitesConServicio AS source
            ON target.nombre_tramite = source.nombre_tramite
        WHEN MATCHED THEN
            UPDATE SET
                target.id_tipo_servicio = source.id_tipo_servicio,
                target.descripcion = source.descripcion,
                target.requiere_costo = source.requiere_costo,
                target.costo_tramite = source.costo_tramite,
                target.campos_obligatorios = source.campos_obligatorios
        WHEN NOT MATCHED THEN
            INSERT (id_tipo_servicio, nombre_tramite, descripcion, requiere_costo, costo_tramite, campos_obligatorios)
            VALUES (source.id_tipo_servicio, source.nombre_tramite, source.descripcion, source.requiere_costo, source.costo_tramite, source.campos_obligatorios);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_generar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_generar;
GO

CREATE PROCEDURE dbo.sp_certificado_generar
    @id_solicitud INT,
    @numero_certificado VARCHAR(50) = NULL,
    @tipo_certificado VARCHAR(50) = 'CIDC_CLASE_A',
    @fecha_vencimiento DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_solicitud IS NULL
    BEGIN
        THROW 50020, 'El parámetro @id_solicitud es obligatorio.', 1;
    END;

    DECLARE @estado_solicitud VARCHAR(50);
    DECLARE @numero_expediente VARCHAR(50);

    SELECT
        @estado_solicitud = estado_solicitud,
        @numero_expediente = numero_expediente
    FROM solicitud
    WHERE id_solicitud = @id_solicitud;

    IF @estado_solicitud IS NULL
    BEGIN
        THROW 50021, 'Solicitud no encontrada.', 1;
    END;

    IF @estado_solicitud <> 'PAGO_CONFIRMADO'
    BEGIN
        THROW 50022, 'La solicitud debe tener pago confirmado para generar un certificado.', 1;
    END;

    IF EXISTS (SELECT 1 FROM certificado_emitido WHERE id_solicitud = @id_solicitud)
    BEGIN
        THROW 50023, 'Ya existe un certificado asociado a esta solicitud.', 1;
    END;

    DECLARE @numero_final VARCHAR(50) =
        CASE
            WHEN @numero_certificado IS NULL OR LTRIM(RTRIM(@numero_certificado)) = ''
                THEN 'CERT-' + CONVERT(VARCHAR(20), CONVERT(BIGINT, DATEDIFF_BIG(MICROSECOND, '2000-01-01', SYSUTCDATETIME())))
            ELSE @numero_certificado
        END;

    IF EXISTS (SELECT 1 FROM certificado_emitido WHERE numero_certificado = @numero_final)
    BEGIN
        THROW 50024, 'El número de certificado ya existe.', 1;
    END;

    DECLARE @fecha_venc DATE = ISNULL(@fecha_vencimiento, CAST(GETDATE() AS DATE));

    INSERT INTO certificado_emitido (
        id_solicitud,
        numero_certificado,
        tipo_certificado,
        fecha_vencimiento,
        estado_certificado
    ) VALUES (
        @id_solicitud,
        @numero_final,
        @tipo_certificado,
        @fecha_venc,
        'ACTIVO'
    );

    DECLARE @nuevo_id INT = SCOPE_IDENTITY();

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        s.numero_expediente
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @nuevo_id;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_obtener', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_obtener;
GO

CREATE PROCEDURE dbo.sp_certificado_obtener
    @id_certificado INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50030, 'Certificado no encontrado.', 1;
    END;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        s.numero_expediente,
        s.estado_solicitud
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @id_certificado;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_obtener_por_solicitud', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_obtener_por_solicitud;
GO

CREATE PROCEDURE dbo.sp_certificado_obtener_por_solicitud
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        ISNULL(c.num_resolucion, c.numero_certificado) AS num_resolucion,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        c.estado_certificado AS estado,
        c.ruta_pdf,
        c.ruta_pdf_firmado,
        c.hash_pdf,
        c.firma_digital_certificado,
        c.id_empleado_firma,
        c.fecha_firma,
        c.datos_certificado,
        c.observaciones
    FROM certificado_emitido c
    WHERE c.id_solicitud = @id_solicitud
    ORDER BY c.fecha_emision DESC;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_listar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_listar;
GO

CREATE PROCEDURE dbo.sp_certificado_listar
    @estado VARCHAR(20) = NULL,
    @fechaDesde DATETIME = NULL,
    @fechaHasta DATETIME = NULL,
    @tipo_certificado VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        ISNULL(c.num_resolucion, c.numero_certificado) AS num_resolucion,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        c.estado_certificado AS estado,
        s.numero_expediente,
        s.numero_solicitud,
        s.id_solicitante,
        s.estado_solicitud
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE (@estado IS NULL OR c.estado_certificado = @estado)
      AND (@tipo_certificado IS NULL OR c.tipo_certificado = @tipo_certificado)
      AND (@fechaDesde IS NULL OR c.fecha_emision >= @fechaDesde)
      AND (@fechaHasta IS NULL OR c.fecha_emision <= @fechaHasta)
    ORDER BY c.fecha_emision DESC, c.id_certificado DESC;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_actualizar_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_actualizar_estado;
GO

CREATE PROCEDURE dbo.sp_certificado_actualizar_estado
    @id_certificado INT,
    @estado_certificado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @estado_certificado NOT IN ('ACTIVO', 'VENCIDO', 'REVOCADO', 'CANCELADO')
    BEGIN
        THROW 50040, 'Estado de certificado inválido.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50041, 'Certificado no encontrado.', 1;
    END;

    UPDATE certificado_emitido
    SET estado_certificado = @estado_certificado
    WHERE id_certificado = @id_certificado;

    SELECT
        id_certificado,
        id_solicitud,
        numero_certificado,
        fecha_emision,
        estado_certificado
    FROM certificado_emitido
    WHERE id_certificado = @id_certificado;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_descargar_info', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_descargar_info;
GO

CREATE PROCEDURE dbo.sp_certificado_descargar_info
    @id_certificado INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50050, 'Certificado no encontrado.', 1;
    END;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        s.numero_expediente,
        s.id_solicitante
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @id_certificado;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_estadisticas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_estadisticas;
GO

CREATE PROCEDURE dbo.sp_certificado_estadisticas
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        estado_certificado AS estado,
        COUNT(*) AS total
    FROM certificado_emitido
    GROUP BY estado_certificado
    ORDER BY total DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_estado;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_estado
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total DECIMAL(10,2) = (SELECT COUNT(*) FROM solicitud);

    SELECT 
        estado_solicitud AS estado,
        COUNT(*) AS total,
        CASE WHEN @total = 0 THEN 0 ELSE CONVERT(DECIMAL(5,2), COUNT(*) * 100.0 / @total) END AS porcentaje
    FROM solicitud
    GROUP BY estado_solicitud
    ORDER BY total DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_mes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_mes;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_mes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        YEAR(fecha_creacion) AS año,
        MONTH(fecha_creacion) AS mes,
        COUNT(*) AS total_solicitudes,
        SUM(CASE WHEN estado_solicitud = 'APROBADA' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado_solicitud = 'RECHAZADA' THEN 1 ELSE 0 END) AS rechazadas
    FROM solicitud
    GROUP BY YEAR(fecha_creacion), MONTH(fecha_creacion)
    ORDER BY año DESC, mes DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_solicitante', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_solicitante;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_solicitante
    @id_solicitante INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.id_solicitud,
        s.numero_expediente,
        s.estado_solicitud,
        s.fecha_creacion,
        s.id_solicitante,
        COUNT(DISTINCT su.id_sustancia) AS total_sustancias
    FROM solicitud s
    LEFT JOIN sustancia_solicitud su ON s.id_solicitud = su.id_solicitud
    WHERE (@id_solicitante IS NULL OR s.id_solicitante = @id_solicitante)
    GROUP BY s.id_solicitud, s.numero_expediente, s.estado_solicitud, 
             s.fecha_creacion, s.id_solicitante
    ORDER BY s.fecha_creacion DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_sustancias_solicitadas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_sustancias_solicitadas;
GO

CREATE PROCEDURE dbo.sp_reporte_sustancias_solicitadas
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.id_sustancia,
        s.nombre_cientifico,
        s.nombre_comercial,
        (SELECT COUNT(*) FROM categoria_droga WHERE id_categoria = s.id_categoria) AS categoria,
        COUNT(DISTINCT ss.id_solicitud) AS total_solicitudes,
        SUM(ss.cantidad_solicitada) AS cantidad_total_solicitada
    FROM sustancia_controlada s
    LEFT JOIN sustancia_solicitud ss ON s.id_sustancia = ss.id_sustancia
    GROUP BY s.id_sustancia, s.nombre_cientifico, s.nombre_comercial, s.id_categoria
    ORDER BY total_solicitudes DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_pagos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_pagos;
GO

CREATE PROCEDURE dbo.sp_reporte_pagos
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.id_pago,
        p.id_solicitud,
        p.monto_total,
        p.referencia_pago,
        p.forma_pago,
        p.estado_pago,
        p.fecha_creacion,
        p.fecha_confirmacion,
        s.numero_expediente
    FROM pago p
    JOIN solicitud s ON p.id_solicitud = s.id_solicitud
    WHERE (@estado IS NULL OR p.estado_pago = @estado)
    ORDER BY p.fecha_creacion DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_archivos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_archivos;
GO

CREATE PROCEDURE dbo.sp_reporte_archivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.tipo_archivo,
        COUNT(*) AS total_archivos,
        SUM(a.tamano_bytes) AS tamaño_total_bytes,
        AVG(CAST(a.tamano_bytes AS FLOAT)) AS tamaño_promedio_bytes
    FROM archivo_adjunto a
    GROUP BY a.tipo_archivo
    ORDER BY total_archivos DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_general', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_general;
GO

CREATE PROCEDURE dbo.sp_reporte_general
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_solicitudes INT = (SELECT COUNT(*) FROM solicitud);
    DECLARE @empleados_activos INT = (SELECT COUNT(*) FROM empleado WHERE estado_empleado = 'ACTIVO');
    DECLARE @total_solicitantes INT = (SELECT COUNT(*) FROM solicitante);
    DECLARE @monto_pagado DECIMAL(18,2) = (SELECT SUM(monto_total) FROM pago WHERE estado_pago = 'CONFIRMADO');
    DECLARE @total_archivos INT = (SELECT COUNT(*) FROM archivo_adjunto);

    SELECT 
        @total_solicitudes AS total_solicitudes,
        @empleados_activos AS empleados_activos,
        @total_solicitantes AS total_solicitantes,
        ISNULL(@monto_pagado, 0) AS monto_pagado,
        @total_archivos AS total_archivos,
        SYSUTCDATETIME() AS fecha_reporte;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_actividad_empleado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_actividad_empleado;
GO

CREATE PROCEDURE dbo.sp_reporte_actividad_empleado
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        e.id_empleado,
        e.nombre_completo,
        e.rol,
        COUNT(DISTINCT h.id_solicitud) AS solicitudes_procesadas,
        MAX(h.fecha_cambio) AS ultima_actividad
    FROM empleado e
    LEFT JOIN historial_estado_solicitud h ON e.id_empleado = h.id_empleado_cambio
    WHERE e.estado_empleado = 'ACTIVO'
    GROUP BY e.id_empleado, e.nombre_completo, e.rol
    ORDER BY solicitudes_procesadas DESC;
END;
GO

-- Procedimientos para archivos adjuntos
IF OBJECT_ID('dbo.sp_archivo_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_crear;
GO
CREATE PROCEDURE dbo.sp_archivo_crear
    @id_solicitud INT,
    @nombre_archivo VARCHAR(255),
    @tipo_archivo VARCHAR(50),
    @ruta_almacenamiento VARCHAR(500),
    @tamano_bytes INT = NULL,
    @mime_type VARCHAR(50) = NULL,
    @hash_sha256 VARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO archivo_adjunto (
        id_solicitud,
        nombre_archivo,
        tipo_archivo,
        ruta_almacenamiento,
        tamano_bytes,
        mime_type,
        hash_sha256,
        estado_archivo
    ) VALUES (
        @id_solicitud,
        @nombre_archivo,
        @tipo_archivo,
        @ruta_almacenamiento,
        @tamano_bytes,
        @mime_type,
        @hash_sha256,
        'PENDIENTE_REVISION'
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_archivo;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_obtener_por_solicitud', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_obtener_por_solicitud;
GO
CREATE PROCEDURE dbo.sp_archivo_obtener_por_solicitud
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_archivo,
        id_solicitud,
        nombre_archivo,
        tipo_archivo,
        ruta_almacenamiento,
        tamano_bytes,
        mime_type,
        hash_sha256,
        estado_archivo,
        comentario_revision,
        id_empleado_revision,
        CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
        CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
    FROM archivo_adjunto
    WHERE id_solicitud = @id_solicitud
    ORDER BY fecha_carga DESC;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_obtener_por_solicitud_tipo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_obtener_por_solicitud_tipo;
GO
CREATE PROCEDURE dbo.sp_archivo_obtener_por_solicitud_tipo
    @id_solicitud INT,
    @tipo_archivo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_archivo,
        id_solicitud,
        nombre_archivo,
        tipo_archivo,
        ruta_almacenamiento,
        tamano_bytes,
        mime_type,
        hash_sha256,
        estado_archivo,
        comentario_revision,
        id_empleado_revision,
        CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
        CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
    FROM archivo_adjunto
    WHERE id_solicitud = @id_solicitud
        AND tipo_archivo = @tipo_archivo
    ORDER BY fecha_carga DESC;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_archivo_obtener_por_id
    @id_archivo INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_archivo,
        id_solicitud,
        nombre_archivo,
        tipo_archivo,
        ruta_almacenamiento,
        tamano_bytes,
        mime_type,
        hash_sha256,
        estado_archivo,
        comentario_revision,
        id_empleado_revision,
        CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
        CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
    FROM archivo_adjunto
    WHERE id_archivo = @id_archivo;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_eliminar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_eliminar;
GO
CREATE PROCEDURE dbo.sp_archivo_eliminar
    @id_archivo INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM archivo_adjunto WHERE id_archivo = @id_archivo;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_actualizar_revision', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_actualizar_revision;
GO
CREATE PROCEDURE dbo.sp_archivo_actualizar_revision
    @id_archivo INT,
    @estado_archivo VARCHAR(50),
    @comentario_revision NVARCHAR(MAX) = NULL,
    @id_empleado_revision INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE archivo_adjunto
    SET
        estado_archivo = @estado_archivo,
        comentario_revision = @comentario_revision,
        id_empleado_revision = @id_empleado_revision,
        fecha_revision = GETDATE()
    WHERE id_archivo = @id_archivo;

    EXEC dbo.sp_archivo_obtener_por_id @id_archivo = @id_archivo;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_resumen_estados', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_resumen_estados;
GO
CREATE PROCEDURE dbo.sp_archivo_resumen_estados
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado_archivo = 'CUMPLE' THEN 1 ELSE 0 END) AS cumpliendo,
        SUM(CASE WHEN estado_archivo = 'NO_CUMPLE' THEN 1 ELSE 0 END) AS no_cumpliendo,
        SUM(CASE WHEN estado_archivo = 'PENDIENTE_REVISION' THEN 1 ELSE 0 END) AS pendiente
    FROM archivo_adjunto
    WHERE id_solicitud = @id_solicitud;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_listar_filtros', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_listar_filtros;
GO
CREATE PROCEDURE dbo.sp_archivo_listar_filtros
    @tipo_archivo VARCHAR(50) = NULL,
    @estado_archivo VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_archivo,
        id_solicitud,
        nombre_archivo,
        tipo_archivo,
        tamano_bytes,
        estado_archivo,
        CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
    FROM archivo_adjunto
    WHERE (@tipo_archivo IS NULL OR tipo_archivo = @tipo_archivo)
        AND (@estado_archivo IS NULL OR estado_archivo = @estado_archivo)
    ORDER BY fecha_carga DESC;
END;
GO

IF OBJECT_ID('dbo.sp_archivo_estadisticas_tipo', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_archivo_estadisticas_tipo;
GO
CREATE PROCEDURE dbo.sp_archivo_estadisticas_tipo
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COALESCE(tipo_archivo, 'SIN_CLASIFICAR') AS tipo_archivo,
        COUNT(*) AS total_archivos,
        SUM(tamano_bytes) AS tamano_total_bytes
    FROM archivo_adjunto
    GROUP BY tipo_archivo;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_validar_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_validar_email;
GO
CREATE PROCEDURE dbo.sp_empleado_validar_email
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(1) AS total
    FROM empleado
    WHERE email = @email;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_empleado_obtener_por_id
    @id_empleado INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        nombre_completo,
        email,
        cedula,
        rol,
        departamento,
        estado_empleado,
        fecha_ingreso,
        fecha_creacion,
        email_confirmado
    FROM empleado
    WHERE id_empleado = @id_empleado;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_listar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_listar;
GO
CREATE PROCEDURE dbo.sp_empleado_listar
    @rol VARCHAR(50) = NULL,
    @departamento VARCHAR(100) = NULL,
    @estado_empleado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        nombre_completo,
        email,
        rol,
        departamento,
        estado_empleado,
        fecha_ingreso,
        fecha_creacion
    FROM empleado
    WHERE (@rol IS NULL OR rol = @rol)
        AND (@departamento IS NULL OR departamento = @departamento)
        AND (@estado_empleado IS NULL OR estado_empleado = @estado_empleado)
    ORDER BY nombre_completo;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_crear;
GO
CREATE PROCEDURE dbo.sp_empleado_crear
    @nombre_completo VARCHAR(255),
    @cedula VARCHAR(20),
    @email VARCHAR(255),
    @password_hash VARCHAR(255),
    @rol VARCHAR(50),
    @departamento VARCHAR(100) = NULL,
    @estado_empleado VARCHAR(20) = 'ACTIVO',
    @token_confirmacion VARCHAR(128) = NULL,
    @token_confirmacion_expira DATETIME = NULL,
    @password_temporal BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO empleado (
        nombre_completo,
        cedula,
        email,
        password_hash,
        rol,
        departamento,
        estado_empleado,
        fecha_ingreso,
        email_confirmado,
        token_confirmacion,
        token_confirmacion_expira,
        password_temporal
    ) VALUES (
        @nombre_completo,
        @cedula,
        @email,
        @password_hash,
        @rol,
        COALESCE(@departamento, ''),
        @estado_empleado,
        GETDATE(),
        0,
        @token_confirmacion,
        @token_confirmacion_expira,
        @password_temporal
    );

    DECLARE @nuevo_id INT = SCOPE_IDENTITY();
    EXEC dbo.sp_empleado_obtener_por_id @id_empleado = @nuevo_id;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_actualizar_datos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_actualizar_datos;
GO
CREATE PROCEDURE dbo.sp_empleado_actualizar_datos
    @id_empleado INT,
    @nombre_completo VARCHAR(255) = NULL,
    @rol VARCHAR(50) = NULL,
    @departamento VARCHAR(100) = NULL,
    @estado_empleado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE empleado
    SET
        nombre_completo = COALESCE(@nombre_completo, nombre_completo),
        rol = COALESCE(@rol, rol),
        departamento = COALESCE(@departamento, departamento),
        estado_empleado = COALESCE(@estado_empleado, estado_empleado)
    WHERE id_empleado = @id_empleado;

    IF @@ROWCOUNT = 0
    BEGIN
        RETURN;
    END;

    EXEC dbo.sp_empleado_obtener_por_id @id_empleado = @id_empleado;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_eliminar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_eliminar;
GO
CREATE PROCEDURE dbo.sp_empleado_eliminar
    @id_empleado INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM empleado WHERE id_empleado = @id_empleado;
    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_obtener_password_hash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_obtener_password_hash;
GO
CREATE PROCEDURE dbo.sp_empleado_obtener_password_hash
    @id_empleado INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        password_hash,
        password_temporal
    FROM empleado
    WHERE id_empleado = @id_empleado;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_actualizar_password', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_actualizar_password;
GO
CREATE PROCEDURE dbo.sp_empleado_actualizar_password
    @id_empleado INT,
    @password_hash VARCHAR(255),
    @password_temporal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE empleado
    SET
        password_hash = @password_hash,
        password_temporal = @password_temporal
    WHERE id_empleado = @id_empleado;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_obtener_por_token_confirmacion', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_obtener_por_token_confirmacion;
GO
CREATE PROCEDURE dbo.sp_empleado_obtener_por_token_confirmacion
    @token VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        email_confirmado,
        token_confirmacion_expira
    FROM empleado
    WHERE token_confirmacion = @token;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_confirmar_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_confirmar_email;
GO
CREATE PROCEDURE dbo.sp_empleado_confirmar_email
    @id_empleado INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE empleado
    SET
        email_confirmado = 1,
        token_confirmacion = NULL,
        token_confirmacion_expira = NULL
    WHERE id_empleado = @id_empleado;

    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_obtener_por_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_obtener_por_email;
GO
CREATE PROCEDURE dbo.sp_empleado_obtener_por_email
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        nombre_completo,
        email,
        cedula,
        rol,
        departamento,
        estado_empleado,
        password_hash,
        email_confirmado,
        password_temporal
    FROM empleado
    WHERE email = @email;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_registrar_token_reset', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_registrar_token_reset;
GO
CREATE PROCEDURE dbo.sp_empleado_registrar_token_reset
    @id_empleado INT,
    @token VARCHAR(128),
    @expira DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE empleado
    SET
        token_reset_password = @token,
        token_reset_expira = @expira
    WHERE id_empleado = @id_empleado;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_obtener_por_token_reset', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_obtener_por_token_reset;
GO
CREATE PROCEDURE dbo.sp_empleado_obtener_por_token_reset
    @token VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_empleado,
        email,
        token_reset_expira
    FROM empleado
    WHERE token_reset_password = @token;
END;
GO

IF OBJECT_ID('dbo.sp_empleado_restablecer_password', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_empleado_restablecer_password;
GO
CREATE PROCEDURE dbo.sp_empleado_restablecer_password
    @id_empleado INT,
    @password_hash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE empleado
    SET
        password_hash = @password_hash,
        password_temporal = 0,
        token_reset_password = NULL,
        token_reset_expira = NULL,
        email_confirmado = 1
    WHERE id_empleado = @id_empleado;

    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

-- Procedimientos para pagos
IF OBJECT_ID('dbo.sp_pago_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_pago_crear;
GO
CREATE PROCEDURE dbo.sp_pago_crear
    @id_solicitud INT,
    @monto_total DECIMAL(18, 2),
    @forma_pago VARCHAR(50),
    @referencia_pago VARCHAR(100) = NULL,
    @monto_costo_administrativo DECIMAL(18, 2) = NULL,
    @monto_tramite DECIMAL(18, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO pago (
        id_solicitud,
        monto_total,
        monto_costo_administrativo,
        monto_tramite,
        forma_pago,
        referencia_pago,
        estado_pago,
        fecha_vencimiento
    ) VALUES (
        @id_solicitud,
        @monto_total,
        COALESCE(@monto_costo_administrativo, 0),
        COALESCE(@monto_tramite, 0),
        @forma_pago,
        @referencia_pago,
        'PENDIENTE',
        DATEADD(day, 5, GETDATE())
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_pago;
END;
GO

IF OBJECT_ID('dbo.sp_pago_obtener_por_solicitud', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_pago_obtener_por_solicitud;
GO
CREATE PROCEDURE dbo.sp_pago_obtener_por_solicitud
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id_pago,
        id_solicitud,
        monto_total,
        monto_costo_administrativo,
        monto_tramite,
        estado_pago,
        CONVERT(VARCHAR(10), fecha_vencimiento, 121) AS fecha_vencimiento,
        forma_pago,
        referencia_pago,
        numero_comprobante,
        id_empleado_verificador,
        CONVERT(VARCHAR(30), fecha_creacion, 121) AS fecha_creacion,
        CONVERT(VARCHAR(30), fecha_confirmacion, 121) AS fecha_confirmacion
    FROM pago
    WHERE id_solicitud = @id_solicitud
    ORDER BY fecha_creacion DESC;
END;
GO

IF OBJECT_ID('dbo.sp_pago_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_pago_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_pago_obtener_por_id
    @id_pago INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_pago,
        id_solicitud,
        monto_total,
        monto_costo_administrativo,
        monto_tramite,
        estado_pago,
        CONVERT(VARCHAR(10), fecha_vencimiento, 121) AS fecha_vencimiento,
        forma_pago,
        referencia_pago,
        numero_comprobante,
        id_empleado_verificador,
        CONVERT(VARCHAR(30), fecha_creacion, 121) AS fecha_creacion,
        CONVERT(VARCHAR(30), fecha_confirmacion, 121) AS fecha_confirmacion
    FROM pago
    WHERE id_pago = @id_pago;
END;
GO

IF OBJECT_ID('dbo.sp_pago_actualizar_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_pago_actualizar_estado;
GO
CREATE PROCEDURE dbo.sp_pago_actualizar_estado
    @id_pago INT,
    @estado_pago VARCHAR(20),
    @numero_comprobante VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE pago
    SET estado_pago = @estado_pago,
            numero_comprobante = @numero_comprobante,
            fecha_confirmacion = CASE WHEN @estado_pago = 'PENDIENTE' THEN fecha_confirmacion ELSE GETDATE() END
    WHERE id_pago = @id_pago;

    SELECT @id_pago AS id_pago, @estado_pago AS estado_pago;
END;
GO

IF OBJECT_ID('dbo.sp_pago_listar_pendientes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_pago_listar_pendientes;
GO
CREATE PROCEDURE dbo.sp_pago_listar_pendientes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.*, s.numero_solicitud, sol.email AS email_solicitante
    FROM pago p
    JOIN solicitud s ON p.id_solicitud = s.id_solicitud
    JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
    WHERE p.estado_pago = 'PENDIENTE'
    ORDER BY p.fecha_creacion DESC;
END;
GO

-- Procedimientos para solicitantes
IF OBJECT_ID('dbo.sp_solicitante_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_crear;
GO
CREATE PROCEDURE dbo.sp_solicitante_crear
    @tipo_solicitante VARCHAR(50),
    @email VARCHAR(100),
    @password_hash VARCHAR(255),
    @telefono VARCHAR(20) = NULL,
    @nombre_completo VARCHAR(100) = NULL,
    @cedula_identidad VARCHAR(20) = NULL,
    @cedula_electoral VARCHAR(20) = NULL,
    @exequatur VARCHAR(20) = NULL,
    @profesion VARCHAR(100) = NULL,
    @numero_colegiatura VARCHAR(50) = NULL,
    @codigo_colegio VARCHAR(20) = NULL,
    @direccion_postal VARCHAR(255) = NULL,
    @telefono_residencial VARCHAR(20) = NULL,
    @telefono_celular VARCHAR(20) = NULL,
    @lugar_trabajo VARCHAR(100) = NULL,
    @email_trabajo VARCHAR(100) = NULL,
    @direccion_trabajo VARCHAR(255) = NULL,
    @telefono_trabajo VARCHAR(20) = NULL,
    @fecha_nacimiento DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO solicitante (
            tipo_solicitante,
            email,
            password_hash,
            telefono,
            estado_cuenta
        ) VALUES (
            @tipo_solicitante,
            @email,
            @password_hash,
            COALESCE(@telefono, ''),
            'ACTIVA'
        );

        DECLARE @id_solicitante INT = CAST(SCOPE_IDENTITY() AS INT);

        IF @tipo_solicitante = 'PROFESIONAL'
        BEGIN
            INSERT INTO profesional (
                id_solicitante,
                nombre_completo,
                cedula_identidad,
                cedula_electoral,
                exequatur,
                profesion,
                numero_colegiatura,
                codigo_colegio,
                direccion_postal,
                telefono_residencial,
                telefono_celular,
                lugar_trabajo,
                email_trabajo,
                direccion_trabajo,
                telefono_trabajo,
                fecha_nacimiento
            ) VALUES (
                @id_solicitante,
                COALESCE(@nombre_completo, ''),
                COALESCE(@cedula_identidad, ''),
                COALESCE(@cedula_electoral, ''),
                COALESCE(@exequatur, ''),
                COALESCE(@profesion, ''),
                COALESCE(@numero_colegiatura, ''),
                COALESCE(@codigo_colegio, ''),
                COALESCE(@direccion_postal, ''),
                COALESCE(@telefono_residencial, ''),
                COALESCE(@telefono_celular, ''),
                COALESCE(@lugar_trabajo, ''),
                COALESCE(@email_trabajo, ''),
                COALESCE(@direccion_trabajo, ''),
                COALESCE(@telefono_trabajo, ''),
                @fecha_nacimiento
            );
        END;

        COMMIT TRANSACTION;

        SELECT @id_solicitante AS id_solicitante;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_existe_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_existe_email;
GO
CREATE PROCEDURE dbo.sp_solicitante_existe_email
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM solicitante WHERE email = @email
    ) THEN 1 ELSE 0 END AS existe;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_obtener_por_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_obtener_por_email;
GO
CREATE PROCEDURE dbo.sp_solicitante_obtener_por_email
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        s.id_solicitante,
        s.tipo_solicitante,
        s.email,
        s.password_hash,
        s.telefono,
        s.estado_cuenta,
        s.fecha_registro,
        s.email_confirmado,
        s.token_confirmacion,
        s.token_confirmacion_expira,
        s.token_reset_password,
        s.token_reset_expira,
        p.nombre_completo,
        p.cedula_identidad,
        p.profesion
    FROM solicitante s
    LEFT JOIN profesional p ON s.id_solicitante = p.id_solicitante
    WHERE s.email = @email;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_obtener_password_hash', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_obtener_password_hash;
GO
CREATE PROCEDURE dbo.sp_solicitante_obtener_password_hash
    @id_solicitante INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_solicitante,
        email,
        password_hash
    FROM solicitante
    WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_solicitante_obtener_por_id
    @id_solicitante INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.id_solicitante,
        s.tipo_solicitante,
        s.email,
        s.telefono,
        s.estado_cuenta,
        s.fecha_registro,
        s.email_confirmado,
        p.nombre_completo,
        p.cedula_identidad,
        p.profesion
IF OBJECT_ID('dbo.sp_solicitante_actualizar_password', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_actualizar_password;
GO
CREATE PROCEDURE dbo.sp_solicitante_actualizar_password
    @id_solicitante INT,
    @password_hash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE solicitante
    SET password_hash = @password_hash,
            token_reset_password = NULL,
            token_reset_expira = NULL,
            email_confirmado = 1
    WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_eliminar_si_no_confirmado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitante_eliminar_si_no_confirmado;
GO
CREATE PROCEDURE dbo.sp_solicitante_eliminar_si_no_confirmado
    @id_solicitante INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM solicitante
    WHERE id_solicitante = @id_solicitante
      AND email_confirmado = 0;

    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

IF OBJECT_ID('dbo.sp_registro_solicitante_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_registro_solicitante_crear;
GO
CREATE PROCEDURE dbo.sp_registro_solicitante_crear
    @email VARCHAR(255),
    @datos_payload NVARCHAR(MAX),
    @token_confirmacion VARCHAR(128),
    @expira DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO solicitante_registro_pendiente (email, datos_payload, token_confirmacion, expira)
    OUTPUT INSERTED.id_registro,
           INSERTED.email,
           INSERTED.datos_payload,
           INSERTED.token_confirmacion,
           INSERTED.expira,
           INSERTED.creado_en
    VALUES (@email, @datos_payload, @token_confirmacion, @expira);
END;
GO

IF OBJECT_ID('dbo.sp_registro_solicitante_obtener_por_token', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_registro_solicitante_obtener_por_token;
GO
CREATE PROCEDURE dbo.sp_registro_solicitante_obtener_por_token
    @token_confirmacion VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM solicitante_registro_pendiente
    WHERE token_confirmacion = @token_confirmacion;
END;
GO

IF OBJECT_ID('dbo.sp_registro_solicitante_obtener_por_email', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_registro_solicitante_obtener_por_email;
GO
CREATE PROCEDURE dbo.sp_registro_solicitante_obtener_por_email
    @email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM solicitante_registro_pendiente
    WHERE email = @email;
END;
GO

IF OBJECT_ID('dbo.sp_registro_solicitante_eliminar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_registro_solicitante_eliminar;
GO
CREATE PROCEDURE dbo.sp_registro_solicitante_eliminar
    @id_registro INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM solicitante_registro_pendiente WHERE id_registro = @id_registro;
    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

IF OBJECT_ID('dbo.sp_estado_solicitud_obtener_por_nombre', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_estado_solicitud_obtener_por_nombre;
GO
CREATE PROCEDURE dbo.sp_estado_solicitud_obtener_por_nombre
    @nombre_estado VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM estado_solicitud_catalogo
    WHERE nombre_estado = @nombre_estado;
END;
GO

IF OBJECT_ID('dbo.sp_estado_solicitud_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_estado_solicitud_crear;
GO
CREATE PROCEDURE dbo.sp_estado_solicitud_crear
    @nombre_estado VARCHAR(50),
    @descripcion NVARCHAR(255) = NULL,
    @orden_secuencial INT = 99,
    @es_estado_inicial BIT = 0,
    @es_estado_final BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO estado_solicitud_catalogo (
        nombre_estado,
        descripcion,
        orden_secuencial,
        es_estado_inicial,
        es_estado_final
    ) VALUES (
        @nombre_estado,
        COALESCE(@descripcion, CONCAT('Estado ', @nombre_estado)),
        @orden_secuencial,
        @es_estado_inicial,
        @es_estado_final
    );

    EXEC dbo.sp_estado_solicitud_obtener_por_nombre @nombre_estado = @nombre_estado;
END;
GO

IF OBJECT_ID('dbo.sp_historial_estado_registrar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_historial_estado_registrar;
GO
CREATE PROCEDURE dbo.sp_historial_estado_registrar
    @id_solicitud INT,
    @estado_anterior VARCHAR(50) = NULL,
    @estado_nuevo VARCHAR(50),
    @id_empleado_cambio INT = NULL,
    @motivo_cambio NVARCHAR(MAX) = NULL,
    @unidad_origen VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO historial_estado_solicitud (
        id_solicitud,
        estado_anterior,
        estado_nuevo,
        id_empleado_cambio,
        motivo_cambio,
        comentario_adicional
    ) VALUES (
        @id_solicitud,
        @estado_anterior,
        @estado_nuevo,
        @id_empleado_cambio,
        @motivo_cambio,
        @unidad_origen
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_historial;
END;
GO

IF OBJECT_ID('dbo.sp_sustancia_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_sustancia_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_sustancia_obtener_por_id
    @id_sustancia INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 *
    FROM sustancia_controlada
    WHERE id_sustancia = @id_sustancia;
END;
GO

IF OBJECT_ID('dbo.sp_auditoria_registrar_cambio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_auditoria_registrar_cambio;
GO
CREATE PROCEDURE dbo.sp_auditoria_registrar_cambio
    @tabla_afectada VARCHAR(50),
    @id_registro INT = NULL,
    @tipo_operacion VARCHAR(20),
    @valores_anteriores NVARCHAR(MAX) = NULL,
    @valores_nuevos NVARCHAR(MAX) = NULL,
    @id_usuario INT = NULL,
    @tipo_usuario VARCHAR(20) = NULL,
    @ip_origen VARCHAR(45) = NULL,
    @navegador_user_agent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO auditoria_cambios (
        tabla_afectada,
        id_registro,
        tipo_operacion,
        valores_anteriores,
        valores_nuevos,
        id_usuario,
        tipo_usuario,
        ip_origen,
        navegador_user_agent
    ) VALUES (
        @tabla_afectada,
        @id_registro,
        @tipo_operacion,
        @valores_anteriores,
        @valores_nuevos,
        @id_usuario,
        @tipo_usuario,
        @ip_origen,
        @navegador_user_agent
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_auditoria;
END;
GO

IF OBJECT_ID('dbo.sp_log_acceso_registrar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_log_acceso_registrar;
GO
CREATE PROCEDURE dbo.sp_log_acceso_registrar
    @tipo_acceso VARCHAR(50),
    @tipo_usuario VARCHAR(20),
    @id_usuario INT = NULL,
    @email_usuario VARCHAR(255) = NULL,
    @resultado VARCHAR(20) = 'EXITOSO',
    @motivo_fallo VARCHAR(500) = NULL,
    @ip_origen VARCHAR(45) = NULL,
    @navegador_user_agent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF UPPER(ISNULL(@tipo_usuario, '')) <> 'EMPLEADO'
    BEGIN
        THROW 70010, 'log_acceso_sistema es exclusivo para usuarios empleados.', 1;
    END;

    INSERT INTO log_acceso_sistema (
        id_usuario,
        tipo_usuario,
        email_usuario,
        tipo_acceso,
        resultado,
        motivo_fallo,
        ip_origen,
        navegador_user_agent
    ) VALUES (
        @id_usuario,
        @tipo_usuario,
        @email_usuario,
        @tipo_acceso,
        UPPER(@resultado),
        @motivo_fallo,
        @ip_origen,
        @navegador_user_agent
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_log;
END;
GO

-- Procedimientos para solicitudes
IF OBJECT_ID('dbo.sp_solicitud_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_crear;
GO
CREATE PROCEDURE dbo.sp_solicitud_crear
    @id_solicitante INT,
    @id_tipo_servicio INT,
    @id_tipo_tramite INT,
    @prioridad VARCHAR(20) = 'NORMAL',
    @fecha_vencimiento DATE = NULL,
    @id_empleado_asignado INT = NULL,
    @numero_cidc_anterior VARCHAR(50) = NULL,
    @motivo_detalle NVARCHAR(MAX) = NULL,
    @datos_servicio_json NVARCHAR(MAX) = NULL,
    @documentos_reportados_json NVARCHAR(MAX) = NULL,
    @resumen_pago_label NVARCHAR(150) = NULL,
    @monto_total_reportado DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @fecha_actual DATE = CAST(GETDATE() AS DATE);
    DECLARE @numero_expediente_base VARCHAR(40) = CONCAT('EXP-', FORMAT(@fecha_actual, 'yyyyMMdd'), '-');

    INSERT INTO solicitud (
        id_solicitante,
        id_tipo_servicio,
        id_tipo_tramite,
        numero_expediente,
        estado_solicitud,
        prioridad,
        fecha_vencimiento,
        id_empleado_asignado,
        numero_cidc_anterior,
        motivo_detalle,
        datos_servicio_json,
        documentos_reportados_json,
        resumen_pago_label,
        monto_total_reportado
    ) VALUES (
        @id_solicitante,
        @id_tipo_servicio,
        @id_tipo_tramite,
        CONCAT(@numero_expediente_base, 'PEND'),
        'CREADA',
        @prioridad,
        COALESCE(@fecha_vencimiento, DATEADD(day, 30, GETDATE())),
        @id_empleado_asignado,
        @numero_cidc_anterior,
        @motivo_detalle,
        @datos_servicio_json,
        @documentos_reportados_json,
        @resumen_pago_label,
        @monto_total_reportado
    );

    DECLARE @id_nueva_solicitud INT = CAST(SCOPE_IDENTITY() AS INT);
    DECLARE @sufijo_id VARCHAR(6) = RIGHT('000000' + CAST(@id_nueva_solicitud AS VARCHAR(6)), 6);
    DECLARE @numero_expediente_final VARCHAR(60) = CONCAT(@numero_expediente_base, @sufijo_id);

    UPDATE solicitud
    SET numero_expediente = @numero_expediente_final
    WHERE id_solicitud = @id_nueva_solicitud;

    SELECT @id_nueva_solicitud AS id_solicitud;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_solicitud_obtener_por_id
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.id_solicitud,
        s.id_solicitante,
        s.id_tipo_servicio,
        s.id_tipo_tramite,
        s.numero_expediente,
        s.estado_solicitud,
        s.prioridad,
        CONVERT(VARCHAR(30), s.fecha_creacion, 121) AS fecha_creacion,
        CONVERT(VARCHAR(30), s.fecha_actualizacion, 121) AS fecha_actualizacion,
        CONVERT(VARCHAR(10), s.fecha_vencimiento, 121) AS fecha_vencimiento,
        CONVERT(VARCHAR(30), s.fecha_envio_datos, 121) AS fecha_envio_datos,
        s.comentario_general,
        s.id_empleado_asignado,
        s.numero_cidc_anterior,
        s.motivo_detalle,
        s.datos_servicio_json,
        s.documentos_reportados_json,
        s.resumen_pago_label,
        s.monto_total_reportado,
        ts.nombre_servicio,
        tt.nombre_tramite,
        sol.email AS email_solicitante,
        sol.telefono AS telefono_solicitante,
        sol.tipo_solicitante,
        COALESCE(prof.nombre_completo, est.razon_social) AS nombre_solicitante,
        COALESCE(prof.cedula_identidad, est.rnc) AS identificador_solicitante,
        COALESCE(prof.telefono_celular, est.telefono_empresa, sol.telefono) AS telefono_contacto,
        prof.profesion AS profesion_solicitante,
        est.tipo_entidad AS tipo_entidad_solicitante
    FROM solicitud s
    LEFT JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
    LEFT JOIN profesional prof ON prof.id_solicitante = sol.id_solicitante
    LEFT JOIN establecimiento est ON est.id_solicitante = sol.id_solicitante
    LEFT JOIN tipo_servicio ts ON s.id_tipo_servicio = ts.id_tipo_servicio
    LEFT JOIN tipo_tramite tt ON s.id_tipo_tramite = tt.id_tipo_tramite
    WHERE s.id_solicitud = @id_solicitud;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_cambiar_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_cambiar_estado;
GO
CREATE PROCEDURE dbo.sp_solicitud_cambiar_estado
    @id_solicitud INT,
    @estado_solicitud VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE solicitud
    SET estado_solicitud = @estado_solicitud,
            fecha_actualizacion = GETDATE()
    WHERE id_solicitud = @id_solicitud
        AND ISNULL(estado_solicitud, '') <> @estado_solicitud;

    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_actualizar_datos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_actualizar_datos;
GO
CREATE PROCEDURE dbo.sp_solicitud_actualizar_datos
    @id_solicitud INT,
    @id_tipo_servicio INT,
    @id_tipo_tramite INT,
    @numero_cidc_anterior VARCHAR(50) = NULL,
    @motivo_detalle NVARCHAR(MAX) = NULL,
    @datos_servicio_json NVARCHAR(MAX) = NULL,
    @documentos_reportados_json NVARCHAR(MAX) = NULL,
    @resumen_pago_label NVARCHAR(150) = NULL,
    @monto_total_reportado DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE solicitud
    SET id_tipo_servicio = @id_tipo_servicio,
            id_tipo_tramite = @id_tipo_tramite,
            numero_cidc_anterior = @numero_cidc_anterior,
            motivo_detalle = @motivo_detalle,
            datos_servicio_json = @datos_servicio_json,
            documentos_reportados_json = @documentos_reportados_json,
            resumen_pago_label = @resumen_pago_label,
            monto_total_reportado = @monto_total_reportado,
            fecha_actualizacion = GETDATE()
    WHERE id_solicitud = @id_solicitud;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_obtener_historial', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_obtener_historial;
GO
CREATE PROCEDURE dbo.sp_solicitud_obtener_historial
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        h.id_historial,
        h.id_solicitud,
        h.estado_anterior,
        h.estado_nuevo,
        h.id_empleado_cambio,
        CONVERT(VARCHAR(30), h.fecha_cambio, 121) AS fecha_cambio,
        h.motivo_cambio,
        h.comentario_adicional,
        e.nombre_completo AS empleado_nombre,
        e.rol AS empleado_rol,
        e.email AS empleado_email
    FROM historial_estado_solicitud h
    LEFT JOIN empleado e ON e.id_empleado = h.id_empleado_cambio
    WHERE h.id_solicitud = @id_solicitud
    ORDER BY h.fecha_cambio DESC;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_obtener_sustancias', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_obtener_sustancias;
GO
CREATE PROCEDURE dbo.sp_solicitud_obtener_sustancias
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM sustancia_solicitud WHERE id_solicitud = @id_solicitud;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_agregar_sustancia', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_agregar_sustancia;
GO
CREATE PROCEDURE dbo.sp_solicitud_agregar_sustancia
    @id_solicitud INT,
    @id_sustancia INT,
    @cantidad_solicitada DECIMAL(18, 3),
    @unidad_medida VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO sustancia_solicitud (id_solicitud, id_sustancia, cantidad_solicitada, unidad_medida)
    VALUES (@id_solicitud, @id_sustancia, @cantidad_solicitada, @unidad_medida);

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_listar_por_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_solicitud_listar_por_estado;
GO
CREATE PROCEDURE dbo.sp_solicitud_listar_por_estado
    @estado VARCHAR(50) = NULL,
    @id_solicitante INT = NULL,
    @skip INT = 0,
    @take INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF @take <= 0 SET @take = 20;
    IF @skip < 0 SET @skip = 0;

    WITH solicitudes_filtradas AS (
        SELECT 
            s.id_solicitud,
            s.id_solicitante,
            s.id_tipo_servicio,
            s.id_tipo_tramite,
            s.numero_solicitud,
            s.numero_expediente,
            s.estado_solicitud AS estado_actual,
            s.prioridad,
            CONVERT(VARCHAR(30), s.fecha_creacion, 121) AS fecha_creacion,
            CONVERT(VARCHAR(30), s.fecha_actualizacion, 121) AS fecha_actualizacion,
            CONVERT(VARCHAR(10), s.fecha_vencimiento, 121) AS fecha_vencimiento,
            CONVERT(VARCHAR(10), s.fecha_creacion, 121) AS fecha_solicitud,
            ts.nombre_servicio,
            tt.nombre_tramite,
            s.comentario_general,
            s.id_empleado_asignado,
            s.numero_cidc_anterior,
            s.motivo_detalle,
            s.resumen_pago_label,
            s.monto_total_reportado,
            s.datos_servicio_json,
            s.documentos_reportados_json,
            sol.email AS email_solicitante,
            sol.telefono AS telefono_solicitante,
            sol.tipo_solicitante,
            COALESCE(prof.nombre_completo, est.razon_social) AS nombre_solicitante,
            COALESCE(prof.cedula_identidad, est.rnc) AS identificador_solicitante,
            COALESCE(prof.telefono_celular, est.telefono_empresa, sol.telefono) AS telefono_contacto,
            ultimo.estado_nuevo AS ultimo_estado,
            ultimo.fecha_cambio AS ultimo_cambio_fecha,
            ultimo.empleado_nombre AS ultimo_cambio_por,
            ROW_NUMBER() OVER (ORDER BY s.fecha_creacion DESC, s.id_solicitud DESC) AS rn
        FROM solicitud s
        LEFT JOIN tipo_servicio ts ON s.id_tipo_servicio = ts.id_tipo_servicio
        LEFT JOIN tipo_tramite tt ON s.id_tipo_tramite = tt.id_tipo_tramite
        LEFT JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
        LEFT JOIN profesional prof ON prof.id_solicitante = sol.id_solicitante
        LEFT JOIN establecimiento est ON est.id_solicitante = sol.id_solicitante
        OUTER APPLY (
            SELECT TOP 1 
                h.estado_nuevo,
                CONVERT(VARCHAR(30), h.fecha_cambio, 121) AS fecha_cambio,
                e.nombre_completo AS empleado_nombre
            FROM historial_estado_solicitud h
            LEFT JOIN empleado e ON h.id_empleado_cambio = e.id_empleado
            WHERE h.id_solicitud = s.id_solicitud
            ORDER BY h.fecha_cambio DESC
        ) ultimo
        WHERE (@estado IS NULL OR s.estado_solicitud = @estado)
          AND (@id_solicitante IS NULL OR s.id_solicitante = @id_solicitante)
    )
    SELECT 
        id_solicitud,
        id_solicitante,
        id_tipo_servicio,
        id_tipo_tramite,
        numero_solicitud,
        numero_expediente,
        estado_actual,
        prioridad,
        fecha_creacion,
        fecha_actualizacion,
        fecha_vencimiento,
        fecha_solicitud,
        nombre_servicio,
        nombre_tramite,
        comentario_general,
        id_empleado_asignado,
        numero_cidc_anterior,
        motivo_detalle,
        resumen_pago_label,
        monto_total_reportado,
        datos_servicio_json,
        documentos_reportados_json,
        email_solicitante,
        telefono_solicitante,
        tipo_solicitante,
        nombre_solicitante,
        identificador_solicitante,
        telefono_contacto,
        ultimo_estado,
        ultimo_cambio_fecha,
        ultimo_cambio_por
    FROM solicitudes_filtradas
    WHERE rn > @skip AND rn <= (@skip + @take)
    ORDER BY rn;
END;
GO

-- Procedimientos para revisión de campos
IF OBJECT_ID('dbo.sp_revision_campo_listar_por_solicitud', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_revision_campo_listar_por_solicitud;
GO
CREATE PROCEDURE dbo.sp_revision_campo_listar_por_solicitud
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_revision,
        id_solicitud,
        nombre_campo,
        etiqueta_campo,
        valor_reportado,
        estado_campo,
        comentario_revision,
        id_empleado_revision,
        CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision
    FROM revision_campo_solicitud
    WHERE id_solicitud = @id_solicitud
    ORDER BY nombre_campo ASC;
END;
GO

IF OBJECT_ID('dbo.sp_revision_campo_guardar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_revision_campo_guardar;
GO
CREATE PROCEDURE dbo.sp_revision_campo_guardar
    @id_solicitud INT,
    @nombre_campo VARCHAR(100),
    @etiqueta_campo VARCHAR(255) = NULL,
    @valor_reportado NVARCHAR(MAX) = NULL,
    @estado_campo VARCHAR(20) = 'PENDIENTE',
    @comentario_revision NVARCHAR(MAX) = NULL,
    @id_empleado_revision INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    MERGE revision_campo_solicitud AS target
    USING (SELECT @id_solicitud AS id_solicitud, @nombre_campo AS nombre_campo) AS source
        ON target.id_solicitud = source.id_solicitud AND target.nombre_campo = source.nombre_campo
    WHEN MATCHED THEN
        UPDATE SET
            etiqueta_campo = @etiqueta_campo,
            valor_reportado = @valor_reportado,
            estado_campo = @estado_campo,
            comentario_revision = @comentario_revision,
            id_empleado_revision = @id_empleado_revision,
            fecha_revision = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (id_solicitud, nombre_campo, etiqueta_campo, valor_reportado, estado_campo, comentario_revision, id_empleado_revision, fecha_revision)
        VALUES (@id_solicitud, @nombre_campo, @etiqueta_campo, @valor_reportado, @estado_campo, @comentario_revision, @id_empleado_revision, GETDATE());

    SELECT TOP 1
        id_revision,
        id_solicitud,
        nombre_campo,
        etiqueta_campo,
        valor_reportado,
        estado_campo,
        comentario_revision,
        id_empleado_revision,
        CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision
    FROM revision_campo_solicitud
    WHERE id_solicitud = @id_solicitud AND nombre_campo = @nombre_campo;
END;
GO

-- Procedimientos para tipo de servicio
IF OBJECT_ID('dbo.sp_tipo_servicio_listar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_servicio_listar;
GO
CREATE PROCEDURE dbo.sp_tipo_servicio_listar
    @incluir_inactivos BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_tipo_servicio,
        nombre_servicio,
        descripcion,
        requiere_costo_administrativo,
        costo_administrativo,
        dias_respuesta,
        estado_servicio
    FROM tipo_servicio
    WHERE (@incluir_inactivos = 1) OR (estado_servicio = 'ACTIVO')
    ORDER BY nombre_servicio ASC;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_servicio_obtener_por_nombre', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_servicio_obtener_por_nombre;
GO
CREATE PROCEDURE dbo.sp_tipo_servicio_obtener_por_nombre
    @nombre_servicio NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id_tipo_servicio,
        nombre_servicio,
        descripcion,
        requiere_costo_administrativo,
        costo_administrativo,
        dias_respuesta,
        estado_servicio
    FROM tipo_servicio
    WHERE nombre_servicio = @nombre_servicio;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_servicio_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_servicio_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_tipo_servicio_obtener_por_id
    @id_tipo_servicio INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_tipo_servicio,
        nombre_servicio,
        descripcion,
        requiere_costo_administrativo,
        costo_administrativo,
        dias_respuesta,
        estado_servicio
    FROM tipo_servicio
    WHERE id_tipo_servicio = @id_tipo_servicio;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_servicio_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_servicio_crear;
GO
CREATE PROCEDURE dbo.sp_tipo_servicio_crear
    @nombre_servicio NVARCHAR(100),
    @descripcion NVARCHAR(500) = NULL,
    @requiere_costo BIT = 0,
    @costo_administrativo DECIMAL(10, 2) = NULL,
    @dias_respuesta INT = 0,
    @estado_servicio VARCHAR(20) = 'ACTIVO'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tipo_servicio (
        nombre_servicio,
        descripcion,
        requiere_costo_administrativo,
        costo_administrativo,
        dias_respuesta,
        estado_servicio
    ) VALUES (
        @nombre_servicio,
        @descripcion,
        @requiere_costo,
        @costo_administrativo,
        @dias_respuesta,
        @estado_servicio
    );

    DECLARE @id_tipo_servicio INT = CAST(SCOPE_IDENTITY() AS INT);

    EXEC dbo.sp_tipo_servicio_obtener_por_id @id_tipo_servicio = @id_tipo_servicio;
END;
GO

-- Procedimientos para tipo de trámite
IF OBJECT_ID('dbo.sp_tipo_tramite_obtener_por_id', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_tramite_obtener_por_id;
GO
CREATE PROCEDURE dbo.sp_tipo_tramite_obtener_por_id
    @id_tipo_tramite INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id_tipo_tramite,
        id_tipo_servicio,
        nombre_tramite,
        descripcion,
        requiere_costo,
        costo_tramite,
        campos_obligatorios
    FROM tipo_tramite
    WHERE id_tipo_tramite = @id_tipo_tramite;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_tramite_obtener_por_nombre', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_tramite_obtener_por_nombre;
GO
CREATE PROCEDURE dbo.sp_tipo_tramite_obtener_por_nombre
    @nombre_tramite VARCHAR(100),
    @id_tipo_servicio INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        id_tipo_tramite,
        id_tipo_servicio,
        nombre_tramite,
        descripcion,
        requiere_costo,
        costo_tramite,
        campos_obligatorios
    FROM tipo_tramite
    WHERE LOWER(nombre_tramite) = LOWER(@nombre_tramite)
        AND (@id_tipo_servicio IS NULL OR id_tipo_servicio = @id_tipo_servicio)
    ORDER BY id_tipo_tramite ASC;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_tramite_crear', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_tramite_crear;
GO
CREATE PROCEDURE dbo.sp_tipo_tramite_crear
    @id_tipo_servicio INT,
    @nombre_tramite VARCHAR(100),
    @descripcion VARCHAR(500) = NULL,
    @requiere_costo BIT = 0,
    @costo_tramite DECIMAL(10, 2) = 0,
    @campos_obligatorios NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tipo_tramite (
        id_tipo_servicio,
        nombre_tramite,
        descripcion,
        requiere_costo,
        costo_tramite,
        campos_obligatorios
    ) VALUES (
        @id_tipo_servicio,
        @nombre_tramite,
        @descripcion,
        @requiere_costo,
        @costo_tramite,
        @campos_obligatorios
    );

    DECLARE @id_tipo_tramite INT = CAST(SCOPE_IDENTITY() AS INT);
    EXEC dbo.sp_tipo_tramite_obtener_por_id @id_tipo_tramite = @id_tipo_tramite;
END;
GO

IF OBJECT_ID('dbo.sp_tipo_tramite_listar_por_servicio', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_tipo_tramite_listar_por_servicio;
GO
CREATE PROCEDURE dbo.sp_tipo_tramite_listar_por_servicio
    @id_tipo_servicio INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_tipo_tramite,
        id_tipo_servicio,
        nombre_tramite,
        descripcion,
        requiere_costo,
        costo_tramite,
        campos_obligatorios
    FROM tipo_tramite
    WHERE (@id_tipo_servicio IS NULL OR id_tipo_servicio = @id_tipo_servicio)
    ORDER BY nombre_tramite ASC;
END;
GO

-- ====================================================================================
-- 12. INFORMACIÓN ADICIONAL
-- ====================================================================================

/*
DOCUMENTACIÓN DE CAMPOS IMPORTANTES:

SOLICITUD:
- numero_expediente: Se genera automáticamente en formato YYYY-MMDD-NNNNN
- estado_solicitud: Estados de transición controlados en aplicación
- prioridad: Afecta orden de procesamiento en bandejas

ARCHIVO_ADJUNTO:
- hash_sha256: Para validar integridad y detectar duplicados
- estado_archivo: CUMPLE/NO_CUMPLE/RECHAZADO por empleado de ventanilla

PAGO:
- monto_total: Suma de costo_administrativo + costo_tramite
- referencia_pago: Información de transferencia/depósito bancario

CERTIFICADO_EMITIDO:
- numero_certificado: Formato CERT-YYYY-NNNNN
- firma_digital_certificado: Base64 del certificado digital (X.509)
- datos_certificado: JSON con datos del solicitante y sustancias autorizadas

AUDITORIA:
- Registra todos los cambios en tablas críticas
- valores_anteriores y valores_nuevos en formato JSON

ROLES DE EMPLEADO:
- VENTANILLA: Recepción y validación inicial de documentos
- TECNICO_UPC: Revisión técnica de solicitudes
- ENCARGADO_UPC: Supervisión y aprobación técnica
- DIRECCION: Revisión de aprobación política
- DNCD: Revisión final de DNCD
- ADMIN: Acceso total al sistema

TRANSICIONES DE ESTADO VÁLIDAS:
CREADA → EN_VENTANILLA
EN_VENTANILLA → DEVUELTA_VENTANILLA o VALIDADA
DEVUELTA_VENTANILLA → EN_VENTANILLA (después de correcciones)
VALIDADA → EN_UPC
EN_UPC → DEVUELTA_UPC o EN_REVISION_UPC
EN_REVISION_UPC → EN_ENCARGADO_UPC
EN_ENCARGADO_UPC → EN_DIRECCION o DENEGADA
DEVUELTA_UPC → EN_UPC (después de correcciones)
EN_DIRECCION → DEVUELTA_DIRECCION o EN_DNCD
DEVUELTA_DIRECCION → EN_DIRECCION (después de correcciones)
EN_DNCD → DEVUELTA_DNCD o PENDIENTE_PAGO o DENEGADA
DEVUELTA_DNCD → EN_DNCD (después de correcciones)
PENDIENTE_PAGO → PAGO_CONFIRMADO o DENEGADA
PAGO_CONFIRMADO → CERTIFICADO_EMITIDO
CERTIFICADO_EMITIDO → COMPLETADA

*/
