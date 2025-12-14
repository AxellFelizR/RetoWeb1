SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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
