-- Insertar tipos de servicio si no existen
IF NOT EXISTS (SELECT 1 FROM tipo_servicio)
BEGIN
    INSERT INTO tipo_servicio (nombre_servicio, descripcion, tiempo_respuesta_dias)
    VALUES 
        ('Autorización de Uso', 'Autorización para uso de sustancias controladas', 30),
        ('Licencia de Importación', 'Licencia para importación de sustancias controladas', 45),
        ('Licencia de Distribución', 'Licencia para distribución de sustancias controladas', 30)
END

-- Insertar tipos de trámite si no existen
IF NOT EXISTS (SELECT 1 FROM tipo_tramite)
BEGIN
    INSERT INTO tipo_tramite (id_tipo_servicio, nombre_tramite, descripcion, requiere_costo, costo_tramite, campos_obligatorios)
    VALUES 
        (1, 'Trámite Normal', 'Trámite ordinario de autorización', 1, 0.00, '[" cedula\, \establecimiento\]'),
 (1, 'Trámite Expedito', 'Trámite expedito de autorización', 1, 500.00, '[\cedula\, \establecimiento\]'),
 (2, 'Importación Ordinaria', 'Importación ordinaria de sustancias', 1, 1000.00, '[\cedula\, \rfc\]'),
 (3, 'Distribución Normal', 'Distribución normal de sustancias', 1, 750.00, '[\cedula\, \establecimiento\]')
END

SELECT 'Datos de prueba insertados exitosamente' as resultado
