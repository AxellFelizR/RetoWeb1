/*
  Agrega el nuevo estado EN_ENCARGADO_UPC para reflejar cuando el encargado está revisando la solicitud.
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- Re crear constraint ck_estado_solicitud con el nuevo estado
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'ck_estado_solicitud' AND parent_object_id = OBJECT_ID('dbo.solicitud')
    )
    BEGIN
        ALTER TABLE solicitud DROP CONSTRAINT ck_estado_solicitud;
    END;

    ALTER TABLE solicitud
    ADD CONSTRAINT ck_estado_solicitud CHECK (
        estado_solicitud IN (
            'CREADA', 'REGISTRADA', 'EN_VENTANILLA', 'DEVUELTA_VENTANILLA', 'VALIDADA',
            'EN_REVISION_UPC', 'EN_ENCARGADO_UPC', 'EN_UPC', 'DEVUELTA_UPC', 'EN_DIRECCION', 'DEVUELTA_DIRECCION',
            'EN_DNCD', 'DEVUELTA_DNCD', 'PENDIENTE_PAGO', 'PAGO_CONFIRMADO', 'APROBADA',
            'RECHAZADA', 'RESOLUCION_EMITIDA', 'CERTIFICADO_EMITIDO', 'COMPLETADA', 'DENEGADA'
        )
    );

    -- Registrar estado en el catálogo si no existe y reacomodar el orden
    IF NOT EXISTS (
        SELECT 1 FROM estado_solicitud_catalogo WHERE nombre_estado = 'EN_ENCARGADO_UPC'
    )
    BEGIN
        UPDATE estado_solicitud_catalogo
        SET orden_secuencial = orden_secuencial + 1
        WHERE orden_secuencial >= 7;

        INSERT INTO estado_solicitud_catalogo (nombre_estado, descripcion, es_estado_inicial, es_estado_final, orden_secuencial)
        VALUES ('EN_ENCARGADO_UPC', 'Revisión final por encargado UPC', 0, 0, 7);
    END
    ELSE
    BEGIN
        UPDATE estado_solicitud_catalogo
        SET descripcion = 'Revisión final por encargado UPC',
            es_estado_inicial = 0,
            es_estado_final = 0,
            orden_secuencial = 7
        WHERE nombre_estado = 'EN_ENCARGADO_UPC';
    END;

    -- Alinear el orden secuencial del resto de estados posteriores
    UPDATE esc
    SET orden_secuencial = mapa.nuevo_orden
    FROM estado_solicitud_catalogo esc
    INNER JOIN (VALUES
        ('EN_UPC', 8),
        ('DEVUELTA_UPC', 9),
        ('EN_DIRECCION', 10),
        ('DEVUELTA_DIRECCION', 11),
        ('EN_DNCD', 12),
        ('DEVUELTA_DNCD', 13),
        ('PENDIENTE_PAGO', 14),
        ('PAGO_CONFIRMADO', 15),
        ('APROBADA', 16),
        ('RECHAZADA', 17),
        ('RESOLUCION_EMITIDA', 18),
        ('CERTIFICADO_EMITIDO', 19),
        ('COMPLETADA', 20),
        ('DENEGADA', 21)
    ) AS mapa(nombre_estado, nuevo_orden)
        ON esc.nombre_estado = mapa.nombre_estado;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @mensaje NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Error agregando estado EN_ENCARGADO_UPC: %s', 16, 1, @mensaje);
END CATCH;
