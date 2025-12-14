-- Stored procedures for pagos, solicitantes y solicitudes
GO

/* ===================== PAGOS ===================== */
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

/* ===================== SOLICITANTES ===================== */
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
  FROM solicitante s
  LEFT JOIN profesional p ON s.id_solicitante = p.id_solicitante
  WHERE s.id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_actualizar_ultimo_acceso', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_actualizar_ultimo_acceso;
GO
CREATE PROCEDURE dbo.sp_solicitante_actualizar_ultimo_acceso
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET fecha_ultimo_acceso = GETDATE()
  WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_guardar_token_confirmacion', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_guardar_token_confirmacion;
GO
CREATE PROCEDURE dbo.sp_solicitante_guardar_token_confirmacion
  @id_solicitante INT,
  @token VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET token_confirmacion = @token,
      token_confirmacion_expira = @expira,
      email_confirmado = 0
  WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_obtener_por_token_confirmacion', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_obtener_por_token_confirmacion;
GO
CREATE PROCEDURE dbo.sp_solicitante_obtener_por_token_confirmacion
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 * FROM solicitante WHERE token_confirmacion = @token;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_confirmar_email', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_confirmar_email;
GO
CREATE PROCEDURE dbo.sp_solicitante_confirmar_email
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET email_confirmado = 1,
      token_confirmacion = NULL,
      token_confirmacion_expira = NULL
  WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_guardar_token_reset', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_guardar_token_reset;
GO
CREATE PROCEDURE dbo.sp_solicitante_guardar_token_reset
  @id_solicitante INT,
  @token VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET token_reset_password = @token,
      token_reset_expira = @expira
  WHERE id_solicitante = @id_solicitante;
END;
GO

IF OBJECT_ID('dbo.sp_solicitante_obtener_por_token_reset', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitante_obtener_por_token_reset;
GO
CREATE PROCEDURE dbo.sp_solicitante_obtener_por_token_reset
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 * FROM solicitante WHERE token_reset_password = @token;
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

/* ===================== SOLICITUDES ===================== */
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
  DECLARE @numero_expediente VARCHAR(50) = CONCAT('EXP-', FORMAT(@fecha_actual, 'yyyyMMdd'), '-', RIGHT('000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR(6)), 6));

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
    @numero_expediente,
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

  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_solicitud;
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

  SELECT 
    s.id_solicitud,
    s.id_solicitante,
    s.id_tipo_servicio,
    s.id_tipo_tramite,
    s.numero_expediente AS numero_solicitud,
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
    ultimo.empleado_nombre AS ultimo_cambio_por
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
  ORDER BY s.fecha_creacion DESC
  OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;
END;
GO

IF OBJECT_ID('dbo.sp_solicitud_eliminar', 'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_solicitud_eliminar;
GO
CREATE PROCEDURE dbo.sp_solicitud_eliminar
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  DELETE FROM solicitud WHERE id_solicitud = @id_solicitud;
END;
GO
