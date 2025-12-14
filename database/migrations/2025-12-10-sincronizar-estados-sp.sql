SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

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
