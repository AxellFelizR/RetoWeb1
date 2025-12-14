-- Stored procedures for archivo_adjunto operations
GO

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
