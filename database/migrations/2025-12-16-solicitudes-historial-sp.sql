-- Stored procedures for solicitud state catalog, historial, sustancias y auditoria
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
