-- Stored procedures for revision_campo_solicitud, tipo_servicio y tipo_tramite
GO

/* ===================== REVISION CAMPO ===================== */
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

/* ===================== TIPO SERVICIO ===================== */
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

/* ===================== TIPO TRÁMITE ===================== */
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
