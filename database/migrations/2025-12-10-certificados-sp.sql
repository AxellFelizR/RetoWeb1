SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
        id_certificado,
        id_solicitud,
        num_resolucion,
        fecha_emision,
        estado
    FROM certificado
    WHERE id_solicitud = @id_solicitud
    ORDER BY fecha_emision DESC;
END;
GO

IF OBJECT_ID('dbo.sp_certificado_listar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_certificado_listar;
GO

CREATE PROCEDURE dbo.sp_certificado_listar
    @estado VARCHAR(20) = NULL,
    @fechaDesde DATETIME = NULL,
    @fechaHasta DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.num_resolucion,
        c.fecha_emision,
        c.estado,
        s.numero_solicitud
    FROM certificado c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE (@estado IS NULL OR c.estado = @estado)
      AND (@fechaDesde IS NULL OR c.fecha_emision >= @fechaDesde)
      AND (@fechaHasta IS NULL OR c.fecha_emision <= @fechaHasta)
    ORDER BY c.fecha_emision DESC;
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
