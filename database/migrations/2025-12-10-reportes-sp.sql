SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_estado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_estado;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_estado
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total DECIMAL(10,2) = (SELECT COUNT(*) FROM solicitud);

    SELECT 
        estado_solicitud AS estado,
        COUNT(*) AS total,
        CASE WHEN @total = 0 THEN 0 ELSE CONVERT(DECIMAL(5,2), COUNT(*) * 100.0 / @total) END AS porcentaje
    FROM solicitud
    GROUP BY estado_solicitud
    ORDER BY total DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_mes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_mes;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_mes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        YEAR(fecha_creacion) AS año,
        MONTH(fecha_creacion) AS mes,
        COUNT(*) AS total_solicitudes,
        SUM(CASE WHEN estado_solicitud = 'APROBADA' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado_solicitud = 'RECHAZADA' THEN 1 ELSE 0 END) AS rechazadas
    FROM solicitud
    GROUP BY YEAR(fecha_creacion), MONTH(fecha_creacion)
    ORDER BY año DESC, mes DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_solicitudes_por_solicitante', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_solicitudes_por_solicitante;
GO

CREATE PROCEDURE dbo.sp_reporte_solicitudes_por_solicitante
    @id_solicitante INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.id_solicitud,
        s.numero_expediente,
        s.estado_solicitud,
        s.fecha_creacion,
        s.id_solicitante,
        COUNT(DISTINCT su.id_sustancia) AS total_sustancias
    FROM solicitud s
    LEFT JOIN sustancia_solicitud su ON s.id_solicitud = su.id_solicitud
    WHERE (@id_solicitante IS NULL OR s.id_solicitante = @id_solicitante)
    GROUP BY s.id_solicitud, s.numero_expediente, s.estado_solicitud, 
             s.fecha_creacion, s.id_solicitante
    ORDER BY s.fecha_creacion DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_sustancias_solicitadas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_sustancias_solicitadas;
GO

CREATE PROCEDURE dbo.sp_reporte_sustancias_solicitadas
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        s.id_sustancia,
        s.nombre_cientifico,
        s.nombre_comercial,
        (SELECT COUNT(*) FROM categoria_droga WHERE id_categoria = s.id_categoria) AS categoria,
        COUNT(DISTINCT ss.id_solicitud) AS total_solicitudes,
        SUM(ss.cantidad_solicitada) AS cantidad_total_solicitada
    FROM sustancia_controlada s
    LEFT JOIN sustancia_solicitud ss ON s.id_sustancia = ss.id_sustancia
    GROUP BY s.id_sustancia, s.nombre_cientifico, s.nombre_comercial, s.id_categoria
    ORDER BY total_solicitudes DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_pagos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_pagos;
GO

CREATE PROCEDURE dbo.sp_reporte_pagos
    @estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.id_pago,
        p.id_solicitud,
        p.monto_total,
        p.referencia_pago,
        p.forma_pago,
        p.estado_pago,
        p.fecha_creacion,
        p.fecha_confirmacion,
        s.numero_expediente
    FROM pago p
    JOIN solicitud s ON p.id_solicitud = s.id_solicitud
    WHERE (@estado IS NULL OR p.estado_pago = @estado)
    ORDER BY p.fecha_creacion DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_archivos', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_archivos;
GO

CREATE PROCEDURE dbo.sp_reporte_archivos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        a.tipo_archivo,
        COUNT(*) AS total_archivos,
        SUM(a.tamano_bytes) AS tamaño_total_bytes,
        AVG(CAST(a.tamano_bytes AS FLOAT)) AS tamaño_promedio_bytes
    FROM archivo_adjunto a
    GROUP BY a.tipo_archivo
    ORDER BY total_archivos DESC;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_general', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_general;
GO

CREATE PROCEDURE dbo.sp_reporte_general
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @total_solicitudes INT = (SELECT COUNT(*) FROM solicitud);
    DECLARE @empleados_activos INT = (SELECT COUNT(*) FROM empleado WHERE estado_empleado = 'ACTIVO');
    DECLARE @total_solicitantes INT = (SELECT COUNT(*) FROM solicitante);
    DECLARE @monto_pagado DECIMAL(18,2) = (SELECT SUM(monto_total) FROM pago WHERE estado_pago = 'CONFIRMADO');
    DECLARE @total_archivos INT = (SELECT COUNT(*) FROM archivo_adjunto);

    SELECT 
        @total_solicitudes AS total_solicitudes,
        @empleados_activos AS empleados_activos,
        @total_solicitantes AS total_solicitantes,
        ISNULL(@monto_pagado, 0) AS monto_pagado,
        @total_archivos AS total_archivos,
        SYSUTCDATETIME() AS fecha_reporte;
END;
GO

IF OBJECT_ID('dbo.sp_reporte_actividad_empleado', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_reporte_actividad_empleado;
GO

CREATE PROCEDURE dbo.sp_reporte_actividad_empleado
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        e.id_empleado,
        e.nombre_completo,
        e.rol,
        COUNT(DISTINCT h.id_solicitud) AS solicitudes_procesadas,
        MAX(h.fecha_cambio) AS ultima_actividad
    FROM empleado e
    LEFT JOIN historial_estado_solicitud h ON e.id_empleado = h.id_empleado_cambio
    WHERE e.estado_empleado = 'ACTIVO'
    GROUP BY e.id_empleado, e.nombre_completo, e.rol
    ORDER BY solicitudes_procesadas DESC;
END;
GO
