/*
  Restaurar distinción entre TECNICO_UPC y ENCARGADO_UPC.
  - Recompone la restricción ck_rol para permitir ambos roles
  - (Opcional) Reasigna empleados específicos nuevamente a ENCARGADO_UPC
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- Regenerar la restricción del rol para incluir ENCARGADO_UPC
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'ck_rol' AND parent_object_id = OBJECT_ID('dbo.empleado')
    )
    BEGIN
        ALTER TABLE empleado DROP CONSTRAINT ck_rol;
    END;

    ALTER TABLE empleado
    ADD CONSTRAINT ck_rol CHECK (
        rol IN ('VENTANILLA', 'TECNICO_UPC', 'ENCARGADO_UPC', 'DIRECCION', 'DNCD', 'ADMIN')
    );

    /*
      Reasignación opcional de personal ENCARGADO_UPC.
      - Sustituye los IDs de ejemplo por los empleados reales que deben volver a ser ENCARGADOS.
      - Si no hay filas en @Encargados, este bloque no realiza cambios.
    */
    DECLARE @Encargados TABLE (id_empleado INT PRIMARY KEY);

    -- INSERT INTO @Encargados (id_empleado) VALUES
    --     (123), -- reemplaza con los IDs reales de tu ambiente
    --     (456);

    IF EXISTS (SELECT 1 FROM @Encargados)
    BEGIN
        UPDATE e
        SET rol = 'ENCARGADO_UPC'
        FROM empleado e
        INNER JOIN @Encargados enc ON enc.id_empleado = e.id_empleado;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @mensaje NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Error restaurando roles UPC: %s', 16, 1, @mensaje);
END CATCH;
