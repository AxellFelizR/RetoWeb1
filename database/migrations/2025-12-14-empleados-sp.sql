-- Stored procedures for empleado operations
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
