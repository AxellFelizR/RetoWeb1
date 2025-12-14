IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'revision_campo_solicitud')
BEGIN
    CREATE TABLE revision_campo_solicitud (
        id_revision INT IDENTITY(1,1) PRIMARY KEY,
        id_solicitud INT NOT NULL,
        nombre_campo VARCHAR(100) NOT NULL,
        etiqueta_campo VARCHAR(255),
        valor_reportado VARCHAR(MAX),
        estado_campo VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        comentario_revision VARCHAR(MAX),
        id_empleado_revision INT,
        fecha_revision DATETIME DEFAULT GETDATE(),
        CONSTRAINT fk_revision_campo_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud(id_solicitud) ON DELETE CASCADE,
        CONSTRAINT fk_revision_campo_empleado FOREIGN KEY (id_empleado_revision) REFERENCES empleado(id_empleado),
        CONSTRAINT ck_estado_campo_revision CHECK (estado_campo IN ('PENDIENTE', 'CUMPLE', 'OBSERVADO')),
        CONSTRAINT uq_revision_campo UNIQUE (id_solicitud, nombre_campo)
    );
END
ELSE
BEGIN
    PRINT 'La tabla revision_campo_solicitud ya existe';
END;
