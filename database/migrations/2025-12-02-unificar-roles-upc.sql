/*
  Unificar roles TECNICO_UPC y ENCARGADO_UPC en un único rol UPC.
  - Actualiza registros existentes con rol ENCARGADO_UPC
  - Recompone la restricción ck_rol en la tabla empleado
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- Migrar registros existentes
    UPDATE empleado
    SET rol = 'TECNICO_UPC'
    WHERE rol = 'ENCARGADO_UPC';

    -- Asegurar que la restricción refleje los roles vigentes
    IF EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE name = 'ck_rol' AND parent_object_id = OBJECT_ID('dbo.empleado')
    )
    BEGIN
        ALTER TABLE empleado DROP CONSTRAINT ck_rol;
    END;

    ALTER TABLE empleado
    ADD CONSTRAINT ck_rol CHECK (
        rol IN ('VENTANILLA', 'TECNICO_UPC', 'DIRECCION', 'DNCD', 'ADMIN')
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @mensaje NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Error unificando roles UPC: %s', 16, 1, @mensaje);
END CATCH;
