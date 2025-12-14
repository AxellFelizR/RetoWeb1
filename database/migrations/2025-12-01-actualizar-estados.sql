-- Actualización de estados permitidos para tabla solicitud
-- Ejecutar en la base de datos DB_SUSTANCIAS_CONTROLADAS_DO antes de usar el panel de admin

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_estado_solicitud')
BEGIN
    ALTER TABLE solicitud DROP CONSTRAINT ck_estado_solicitud;
END
GO

ALTER TABLE solicitud ADD CONSTRAINT ck_estado_solicitud CHECK (estado_solicitud IN (
    'CREADA', 'REGISTRADA', 'EN_VENTANILLA', 'DEVUELTA_VENTANILLA', 'VALIDADA',
    'EN_REVISION_UPC', 'EN_UPC', 'DEVUELTA_UPC', 'EN_DIRECCION', 'DEVUELTA_DIRECCION',
    'EN_DNCD', 'DEVUELTA_DNCD', 'PENDIENTE_PAGO', 'PAGO_CONFIRMADO', 'APROBADA',
    'RECHAZADA', 'RESOLUCION_EMITIDA', 'CERTIFICADO_EMITIDO', 'COMPLETADA', 'DENEGADA'
));
GO

DECLARE @Estados TABLE (
    nombre_estado VARCHAR(50),
    descripcion VARCHAR(255),
    es_inicial BIT,
    es_final BIT,
    orden_secuencial INT
);

INSERT INTO @Estados (nombre_estado, descripcion, es_inicial, es_final, orden_secuencial)
VALUES
    ('CREADA', 'Solicitud recién creada', 1, 0, 1),
    ('REGISTRADA', 'Registrada por ventanilla', 0, 0, 2),
    ('EN_VENTANILLA', 'En revisión por Ventanilla Única', 0, 0, 3),
    ('DEVUELTA_VENTANILLA', 'Devuelta por Ventanilla para completar documentos', 0, 0, 4),
    ('VALIDADA', 'Validada en ventanilla', 0, 0, 5),
    ('EN_REVISION_UPC', 'En revisión técnica UPC', 0, 0, 6),
    ('EN_UPC', 'En evaluación técnica UPC', 0, 0, 7),
    ('DEVUELTA_UPC', 'Devuelta por UPC para aclaraciones', 0, 0, 8),
    ('EN_DIRECCION', 'En aprobación de Dirección', 0, 0, 9),
    ('DEVUELTA_DIRECCION', 'Devuelta por Dirección', 0, 0, 10),
    ('EN_DNCD', 'En revisión final DNCD', 0, 0, 11),
    ('DEVUELTA_DNCD', 'Devuelta por DNCD', 0, 0, 12),
    ('PENDIENTE_PAGO', 'Pendiente confirmación de pago', 0, 0, 13),
    ('PAGO_CONFIRMADO', 'Pago confirmado', 0, 0, 14),
    ('APROBADA', 'Solicitud aprobada', 0, 1, 15),
    ('RECHAZADA', 'Solicitud rechazada', 0, 1, 16),
    ('RESOLUCION_EMITIDA', 'Resolución emitida', 0, 1, 17),
    ('CERTIFICADO_EMITIDO', 'Certificado emitido', 0, 1, 18),
    ('COMPLETADA', 'Trámite completado', 0, 1, 19),
    ('DENEGADA', 'Solicitud denegada', 0, 1, 20);

MERGE estado_solicitud_catalogo AS target
USING @Estados AS source
    ON target.nombre_estado = source.nombre_estado
WHEN MATCHED THEN
    UPDATE SET
        descripcion = source.descripcion,
        es_estado_inicial = source.es_inicial,
        es_estado_final = source.es_final,
        orden_secuencial = source.orden_secuencial
WHEN NOT MATCHED THEN
    INSERT (nombre_estado, descripcion, es_estado_inicial, es_estado_final, orden_secuencial)
    VALUES (source.nombre_estado, source.descripcion, source.es_inicial, source.es_final, source.orden_secuencial);
GO
