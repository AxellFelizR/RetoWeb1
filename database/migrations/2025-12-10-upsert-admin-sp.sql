SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('dbo.sp_upsert_admin_empleado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_upsert_admin_empleado;
GO

CREATE PROCEDURE dbo.sp_upsert_admin_empleado
    @Nombre NVARCHAR(255),
    @Cedula NVARCHAR(20),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Departamento NVARCHAR(100),
    @EmpleadoId INT OUTPUT,
    @FueActualizado BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Email IS NULL OR LTRIM(RTRIM(@Email)) = ''
    BEGIN
        THROW 60001, 'El correo institucional es obligatorio.', 1;
    END;

    IF @PasswordHash IS NULL OR LEN(@PasswordHash) < 8
    BEGIN
        THROW 60002, 'El hash de la contraseña no es válido.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @EmpleadoId = id_empleado
        FROM empleado
        WHERE email = @Email;

        IF @EmpleadoId IS NOT NULL
        BEGIN
            UPDATE empleado
            SET nombre_completo = @Nombre,
                cedula = @Cedula,
                departamento = @Departamento,
                password_hash = @PasswordHash,
                rol = 'ADMIN',
                estado_empleado = 'ACTIVO',
                email_confirmado = 1,
                token_confirmacion = NULL,
                token_confirmacion_expira = NULL,
                password_temporal = 0
            WHERE id_empleado = @EmpleadoId;

            SET @FueActualizado = 1;
        END
        ELSE
        BEGIN
            INSERT INTO empleado (
                nombre_completo,
                cedula,
                email,
                password_hash,
                rol,
                departamento,
                estado_empleado,
                fecha_ingreso,
                fecha_creacion,
                email_confirmado,
                token_confirmacion,
                token_confirmacion_expira,
                password_temporal
            )
            VALUES (
                @Nombre,
                @Cedula,
                @Email,
                @PasswordHash,
                'ADMIN',
                @Departamento,
                'ACTIVO',
                GETDATE(),
                GETDATE(),
                1,
                NULL,
                NULL,
                0
            );

            SET @EmpleadoId = SCOPE_IDENTITY();
            SET @FueActualizado = 0;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;

    SELECT @EmpleadoId AS id_empleado, @FueActualizado AS fue_actualizado;
END;
GO
