SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Migración: Campos para confirmación y reset
-- Fecha: 2025-12-10
-- =============================================

-- ============================
-- Tabla: solicitante
-- ============================
IF COL_LENGTH('solicitante', 'email_confirmado') IS NULL
BEGIN
    ALTER TABLE solicitante
    ADD email_confirmado BIT NOT NULL CONSTRAINT DF_solicitante_email_confirmado DEFAULT 0 WITH VALUES;
END;

IF COL_LENGTH('solicitante', 'token_confirmacion') IS NULL
BEGIN
    ALTER TABLE solicitante ADD token_confirmacion VARCHAR(128) NULL;
END;

IF COL_LENGTH('solicitante', 'token_confirmacion_expira') IS NULL
BEGIN
    ALTER TABLE solicitante ADD token_confirmacion_expira DATETIME NULL;
END;

IF COL_LENGTH('solicitante', 'token_reset_password') IS NULL
BEGIN
    ALTER TABLE solicitante ADD token_reset_password VARCHAR(128) NULL;
END;

IF COL_LENGTH('solicitante', 'token_reset_expira') IS NULL
BEGIN
    ALTER TABLE solicitante ADD token_reset_expira DATETIME NULL;
END;

-- Establecer confirmación para registros previos (solo si la columna existe)
IF COL_LENGTH('solicitante', 'email_confirmado') IS NOT NULL
BEGIN
    EXEC ('UPDATE solicitante SET email_confirmado = 1 WHERE email_confirmado IS NULL OR email_confirmado = 0;');
END;

-- ============================
-- Tabla: empleado
-- ============================
IF COL_LENGTH('empleado', 'email_confirmado') IS NULL
BEGIN
    ALTER TABLE empleado
    ADD email_confirmado BIT NOT NULL CONSTRAINT DF_empleado_email_confirmado DEFAULT 0 WITH VALUES;
END;

IF COL_LENGTH('empleado', 'token_confirmacion') IS NULL
BEGIN
    ALTER TABLE empleado ADD token_confirmacion VARCHAR(128) NULL;
END;

IF COL_LENGTH('empleado', 'token_confirmacion_expira') IS NULL
BEGIN
    ALTER TABLE empleado ADD token_confirmacion_expira DATETIME NULL;
END;

IF COL_LENGTH('empleado', 'token_reset_password') IS NULL
BEGIN
    ALTER TABLE empleado ADD token_reset_password VARCHAR(128) NULL;
END;

IF COL_LENGTH('empleado', 'token_reset_expira') IS NULL
BEGIN
    ALTER TABLE empleado ADD token_reset_expira DATETIME NULL;
END;

IF COL_LENGTH('empleado', 'password_temporal') IS NULL
BEGIN
    ALTER TABLE empleado
    ADD password_temporal BIT NOT NULL CONSTRAINT DF_empleado_password_temporal DEFAULT 0 WITH VALUES;
END;

-- Establecer confirmación y limpiar flag temporal para registros existentes (solo si existen las columnas)
IF COL_LENGTH('empleado', 'email_confirmado') IS NOT NULL
BEGIN
    EXEC ('UPDATE empleado SET email_confirmado = 1 WHERE email_confirmado IS NULL OR email_confirmado = 0;');
END;

IF COL_LENGTH('empleado', 'password_temporal') IS NOT NULL
BEGIN
    EXEC ('UPDATE empleado SET password_temporal = 0 WHERE password_temporal IS NULL;');
END;

-- ============================
-- Índices para búsqueda por token
-- ============================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_solicitante_token_confirmacion' AND object_id = OBJECT_ID('solicitante'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_solicitante_token_confirmacion ON solicitante(token_confirmacion);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_solicitante_token_reset' AND object_id = OBJECT_ID('solicitante'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_solicitante_token_reset ON solicitante(token_reset_password);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_empleado_token_confirmacion' AND object_id = OBJECT_ID('empleado'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_empleado_token_confirmacion ON empleado(token_confirmacion);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_empleado_token_reset' AND object_id = OBJECT_ID('empleado'))
BEGIN
    CREATE NONCLUSTERED INDEX idx_empleado_token_reset ON empleado(token_reset_password);
END;
GO
