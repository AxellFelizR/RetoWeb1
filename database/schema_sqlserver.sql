---------------------
Script base de datos
---------------------

USE [DB_SUSTANCIAS_CONTROLADAS_DO]
GO
/****** Object:  Table [dbo].[certificado_emitido]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[certificado_emitido](
	[id_certificado] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[numero_certificado] [varchar](50) NOT NULL,
	[num_resolucion] [varchar](100) NULL,
	[tipo_certificado] [varchar](50) NOT NULL,
	[fecha_emision] [datetime] NULL,
	[fecha_vencimiento] [date] NULL,
	[estado_certificado] [varchar](20) NULL,
	[ruta_pdf] [varchar](500) NULL,
	[ruta_pdf_firmado] [varchar](500) NULL,
	[hash_pdf] [varchar](64) NULL,
	[firma_digital_certificado] [varchar](max) NULL,
	[id_empleado_firma] [int] NULL,
	[fecha_firma] [datetime] NULL,
	[datos_certificado] [varchar](max) NULL,
	[observaciones] [varchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_certificado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[id_solicitud] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[numero_certificado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[certificado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[certificado] AS
SELECT
    id_certificado,
    id_solicitud,
    ISNULL(num_resolucion, numero_certificado) AS num_resolucion,
    fecha_emision,
    estado_certificado AS estado
FROM certificado_emitido;
GO
/****** Object:  Table [dbo].[actividad_establecimiento]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[actividad_establecimiento](
	[id_actividad] [int] IDENTITY(1,1) NOT NULL,
	[id_establecimiento] [int] NOT NULL,
	[tipo_actividad] [varchar](50) NOT NULL,
	[descripcion_otra] [varchar](500) NULL,
	[fecha_registro] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_actividad] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[archivo_adjunto]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[archivo_adjunto](
	[id_archivo] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[nombre_archivo] [varchar](255) NOT NULL,
	[tipo_archivo] [varchar](50) NOT NULL,
	[ruta_almacenamiento] [varchar](500) NOT NULL,
	[tamano_bytes] [int] NULL,
	[mime_type] [varchar](50) NULL,
	[hash_sha256] [varchar](64) NULL,
	[estado_archivo] [varchar](50) NULL,
	[comentario_revision] [varchar](max) NULL,
	[id_empleado_revision] [int] NULL,
	[fecha_revision] [datetime] NULL,
	[fecha_carga] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_archivo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[auditoria_cambios]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[auditoria_cambios](
	[id_auditoria] [int] IDENTITY(1,1) NOT NULL,
	[tabla_afectada] [varchar](50) NOT NULL,
	[id_registro] [int] NULL,
	[tipo_operacion] [varchar](20) NOT NULL,
	[valores_anteriores] [varchar](max) NULL,
	[valores_nuevos] [varchar](max) NULL,
	[id_usuario] [int] NULL,
	[tipo_usuario] [varchar](20) NULL,
	[fecha_operacion] [datetime] NULL,
	[ip_origen] [varchar](45) NULL,
	[navegador_user_agent] [varchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_auditoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[categoria_droga]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[categoria_droga](
	[id_categoria] [int] IDENTITY(1,1) NOT NULL,
	[nombre_categoria] [varchar](100) NOT NULL,
	[descripcion] [varchar](500) NULL,
	[numero_categoria] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[numero_categoria] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[contacto_establecimiento]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[contacto_establecimiento](
	[id_contacto] [int] IDENTITY(1,1) NOT NULL,
	[id_establecimiento] [int] NOT NULL,
	[tipo_contacto] [varchar](50) NOT NULL,
	[nombre_completo] [varchar](255) NOT NULL,
	[cedula] [varchar](20) NULL,
	[rnc] [varchar](20) NULL,
	[direccion] [varchar](500) NULL,
	[telefono] [varchar](20) NULL,
	[email] [varchar](255) NULL,
	[otro_lugar_trabajo] [varchar](255) NULL,
	[exequatur] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_contacto] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[empleado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[empleado](
	[id_empleado] [int] IDENTITY(1,1) NOT NULL,
	[nombre_completo] [varchar](255) NOT NULL,
	[cedula] [varchar](20) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[rol] [varchar](50) NOT NULL,
	[departamento] [varchar](100) NULL,
	[estado_empleado] [varchar](20) NULL,
	[fecha_ingreso] [date] NULL,
	[fecha_creacion] [datetime] NULL,
	[email_confirmado] [bit] NOT NULL,
	[token_confirmacion] [varchar](128) NULL,
	[token_confirmacion_expira] [datetime] NULL,
	[token_reset_password] [varchar](128) NULL,
	[token_reset_expira] [datetime] NULL,
	[password_temporal] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_empleado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[cedula] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_empleado_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[establecimiento]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[establecimiento](
	[id_establecimiento] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitante] [int] NOT NULL,
	[razon_social] [varchar](255) NOT NULL,
	[rnc] [varchar](20) NOT NULL,
	[direccion_postal] [varchar](500) NULL,
	[email_empresa] [varchar](255) NULL,
	[telefono_empresa] [varchar](20) NULL,
	[tipo_entidad] [varchar](50) NOT NULL,
	[estado_empresa] [varchar](20) NULL,
	[fecha_constitucion] [date] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_establecimiento] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[rnc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[id_solicitante] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_establecimiento_rnc] UNIQUE NONCLUSTERED 
(
	[rnc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[estado_solicitud_catalogo]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[estado_solicitud_catalogo](
	[id_estado] [int] IDENTITY(1,1) NOT NULL,
	[nombre_estado] [varchar](50) NOT NULL,
	[descripcion] [varchar](255) NULL,
	[es_estado_inicial] [bit] NULL,
	[es_estado_final] [bit] NULL,
	[orden_secuencial] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre_estado] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[formulario_requisito]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[formulario_requisito](
	[id_requisito] [int] IDENTITY(1,1) NOT NULL,
	[id_tipo_servicio] [int] NULL,
	[id_tipo_tramite] [int] NULL,
	[nombre_corto] [varchar](150) NOT NULL,
	[descripcion] [nvarchar](500) NULL,
	[es_obligatorio] [bit] NOT NULL,
	[tipo_input] [varchar](50) NOT NULL,
	[tipo_archivo_permitido] [varchar](100) NULL,
	[tamano_max_mb] [int] NULL,
	[orden_visual] [int] NOT NULL,
	[activo] [bit] NOT NULL,
	[fecha_creacion] [datetime] NOT NULL,
	[fecha_actualizacion] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id_requisito] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[historial_estado_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[historial_estado_solicitud](
	[id_historial] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[estado_anterior] [varchar](50) NULL,
	[estado_nuevo] [varchar](50) NOT NULL,
	[id_empleado_cambio] [int] NULL,
	[fecha_cambio] [datetime] NULL,
	[motivo_cambio] [varchar](max) NULL,
	[comentario_adicional] [varchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_historial] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[log_acceso_sistema]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[log_acceso_sistema](
	[id_log] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NULL,
	[tipo_usuario] [varchar](20) NULL,
	[email_usuario] [varchar](255) NULL,
	[fecha_acceso] [datetime] NULL,
	[tipo_acceso] [varchar](50) NULL,
	[ip_origen] [varchar](45) NULL,
	[navegador_user_agent] [varchar](500) NULL,
	[resultado] [varchar](20) NULL,
	[motivo_fallo] [varchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_log] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pago]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pago](
	[id_pago] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[monto_total] [decimal](10, 2) NOT NULL,
	[monto_costo_administrativo] [decimal](10, 2) NULL,
	[monto_tramite] [decimal](10, 2) NULL,
	[estado_pago] [varchar](20) NULL,
	[fecha_vencimiento] [date] NULL,
	[forma_pago] [varchar](50) NULL,
	[referencia_pago] [varchar](100) NULL,
	[numero_comprobante] [varchar](50) NULL,
	[id_empleado_verificador] [int] NULL,
	[fecha_creacion] [datetime] NULL,
	[fecha_confirmacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_pago] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[profesional]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[profesional](
	[id_profesional] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitante] [int] NOT NULL,
	[nombre_completo] [varchar](255) NOT NULL,
	[cedula_identidad] [varchar](20) NOT NULL,
	[cedula_electoral] [varchar](20) NULL,
	[exequatur] [varchar](100) NULL,
	[profesion] [varchar](100) NOT NULL,
	[numero_colegiatura] [varchar](100) NULL,
	[codigo_colegio] [varchar](100) NULL,
	[direccion_postal] [varchar](500) NULL,
	[telefono_residencial] [varchar](20) NULL,
	[telefono_celular] [varchar](20) NULL,
	[lugar_trabajo] [varchar](255) NULL,
	[email_trabajo] [varchar](255) NULL,
	[direccion_trabajo] [varchar](500) NULL,
	[telefono_trabajo] [varchar](20) NULL,
	[fecha_nacimiento] [date] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_profesional] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[cedula_identidad] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[id_solicitante] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_profesional_cedula] UNIQUE NONCLUSTERED 
(
	[cedula_identidad] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[revision_campo_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[revision_campo_solicitud](
	[id_revision] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[nombre_campo] [varchar](100) NOT NULL,
	[etiqueta_campo] [varchar](255) NULL,
	[valor_reportado] [varchar](max) NULL,
	[estado_campo] [varchar](20) NOT NULL,
	[comentario_revision] [varchar](max) NULL,
	[id_empleado_revision] [int] NULL,
	[fecha_revision] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_revision] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_revision_campo] UNIQUE NONCLUSTERED 
(
	[id_solicitud] ASC,
	[nombre_campo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[solicitante]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[solicitante](
	[id_solicitante] [int] IDENTITY(1,1) NOT NULL,
	[tipo_solicitante] [varchar](50) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[telefono] [varchar](20) NULL,
	[estado_cuenta] [varchar](20) NULL,
	[fecha_registro] [datetime] NULL,
	[fecha_ultimo_acceso] [datetime] NULL,
	[email_confirmado] [bit] NOT NULL,
	[token_confirmacion] [varchar](128) NULL,
	[token_confirmacion_expira] [datetime] NULL,
	[token_reset_password] [varchar](128) NULL,
	[token_reset_expira] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_solicitante] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [uq_solicitante_email] UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[solicitante_registro_pendiente]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[solicitante_registro_pendiente](
	[id_registro] [int] IDENTITY(1,1) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[datos_payload] [nvarchar](max) NOT NULL,
	[token_confirmacion] [varchar](128) NOT NULL,
	[expira] [datetime] NOT NULL,
	[creado_en] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_registro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[token_confirmacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[solicitud](
	[id_solicitud] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitante] [int] NOT NULL,
	[id_tipo_servicio] [int] NOT NULL,
	[id_tipo_tramite] [int] NOT NULL,
	[numero_expediente] [varchar](50) NULL,
	[numero_solicitud] [varchar](50) NOT NULL,
	[estado_solicitud] [varchar](50) NOT NULL,
	[prioridad] [varchar](20) NULL,
	[fecha_creacion] [datetime] NULL,
	[fecha_actualizacion] [datetime] NULL,
	[fecha_vencimiento] [date] NULL,
	[fecha_envio_datos] [datetime] NULL,
	[comentario_general] [varchar](max) NULL,
	[numero_cidc_anterior] [nvarchar](50) NULL,
	[motivo_detalle] [nvarchar](max) NULL,
	[datos_servicio_json] [nvarchar](max) NULL,
	[documentos_reportados_json] [nvarchar](max) NULL,
	[resumen_pago_label] [nvarchar](150) NULL,
	[monto_total_reportado] [decimal](12, 2) NULL,
	[id_empleado_asignado] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_solicitud] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[numero_solicitud] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[numero_expediente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sustancia_controlada]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sustancia_controlada](
	[id_sustancia] [int] IDENTITY(1,1) NOT NULL,
	[id_categoria] [int] NOT NULL,
	[nombre_cientifico] [varchar](255) NOT NULL,
	[nombre_comercial] [varchar](255) NULL,
	[codigo_sustancia] [varchar](50) NOT NULL,
	[formula_quimica] [varchar](100) NULL,
	[peso_molecular] [decimal](10, 4) NULL,
	[nivel_restriccion] [int] NULL,
	[requiere_licencia_importacion] [bit] NULL,
	[requiere_licencia_uso] [bit] NULL,
	[estado_sustancia] [varchar](20) NULL,
	[fecha_creacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_sustancia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[codigo_sustancia] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[sustancia_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[sustancia_solicitud](
	[id_sustancia_solicitud] [int] IDENTITY(1,1) NOT NULL,
	[id_solicitud] [int] NOT NULL,
	[id_sustancia] [int] NOT NULL,
	[cantidad_solicitada] [decimal](12, 3) NULL,
	[unidad_medida] [varchar](20) NULL,
	[especificacion_uso] [varchar](500) NULL,
	[proveedor] [varchar](255) NULL,
	[pais_origen] [varchar](100) NULL,
	[fecha_agregacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id_sustancia_solicitud] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipo_servicio]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipo_servicio](
	[id_tipo_servicio] [int] IDENTITY(1,1) NOT NULL,
	[nombre_servicio] [varchar](100) NOT NULL,
	[descripcion] [varchar](500) NULL,
	[requiere_costo_administrativo] [bit] NULL,
	[costo_administrativo] [decimal](10, 2) NULL,
	[dias_respuesta] [int] NULL,
	[estado_servicio] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_tipo_servicio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre_servicio] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipo_tramite]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipo_tramite](
	[id_tipo_tramite] [int] IDENTITY(1,1) NOT NULL,
	[id_tipo_servicio] [int] NOT NULL,
	[nombre_tramite] [varchar](100) NOT NULL,
	[descripcion] [varchar](500) NULL,
	[requiere_costo] [bit] NULL,
	[costo_tramite] [decimal](10, 2) NULL,
	[campos_obligatorios] [varchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_tipo_tramite] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[actividad_establecimiento] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[archivo_adjunto] ADD  DEFAULT ('PENDIENTE_REVISION') FOR [estado_archivo]
GO
ALTER TABLE [dbo].[archivo_adjunto] ADD  DEFAULT (getdate()) FOR [fecha_carga]
GO
ALTER TABLE [dbo].[auditoria_cambios] ADD  DEFAULT (getdate()) FOR [fecha_operacion]
GO
ALTER TABLE [dbo].[certificado_emitido] ADD  DEFAULT (getdate()) FOR [fecha_emision]
GO
ALTER TABLE [dbo].[certificado_emitido] ADD  DEFAULT ('ACTIVO') FOR [estado_certificado]
GO
ALTER TABLE [dbo].[empleado] ADD  DEFAULT ('ACTIVO') FOR [estado_empleado]
GO
ALTER TABLE [dbo].[empleado] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[empleado] ADD  DEFAULT ((0)) FOR [email_confirmado]
GO
ALTER TABLE [dbo].[empleado] ADD  DEFAULT ((0)) FOR [password_temporal]
GO
ALTER TABLE [dbo].[establecimiento] ADD  DEFAULT ('ACTIVA') FOR [estado_empresa]
GO
ALTER TABLE [dbo].[estado_solicitud_catalogo] ADD  DEFAULT ((0)) FOR [es_estado_inicial]
GO
ALTER TABLE [dbo].[estado_solicitud_catalogo] ADD  DEFAULT ((0)) FOR [es_estado_final]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT ((1)) FOR [es_obligatorio]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT ('archivo') FOR [tipo_input]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT ((1)) FOR [orden_visual]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[formulario_requisito] ADD  DEFAULT (getdate()) FOR [fecha_actualizacion]
GO
ALTER TABLE [dbo].[historial_estado_solicitud] ADD  DEFAULT (getdate()) FOR [fecha_cambio]
GO
ALTER TABLE [dbo].[log_acceso_sistema] ADD  DEFAULT (getdate()) FOR [fecha_acceso]
GO
ALTER TABLE [dbo].[log_acceso_sistema] ADD  DEFAULT ('EXITOSO') FOR [resultado]
GO
ALTER TABLE [dbo].[pago] ADD  DEFAULT ('PENDIENTE') FOR [estado_pago]
GO
ALTER TABLE [dbo].[pago] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[revision_campo_solicitud] ADD  DEFAULT ('PENDIENTE') FOR [estado_campo]
GO
ALTER TABLE [dbo].[revision_campo_solicitud] ADD  DEFAULT (getdate()) FOR [fecha_revision]
GO
ALTER TABLE [dbo].[solicitante] ADD  DEFAULT ('ACTIVA') FOR [estado_cuenta]
GO
ALTER TABLE [dbo].[solicitante] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[solicitante] ADD  DEFAULT ((0)) FOR [email_confirmado]
GO
ALTER TABLE [dbo].[solicitante_registro_pendiente] ADD  DEFAULT (getdate()) FOR [creado_en]
GO
ALTER TABLE [dbo].[solicitud] ADD  DEFAULT ((('SOL-'+CONVERT([varchar](8),getdate(),(112)))+'-')+right('000000'+CONVERT([varchar](6),abs(checksum(newid()))%(1000000)),(6))) FOR [numero_solicitud]
GO
ALTER TABLE [dbo].[solicitud] ADD  DEFAULT ('CREADA') FOR [estado_solicitud]
GO
ALTER TABLE [dbo].[solicitud] ADD  DEFAULT ('NORMAL') FOR [prioridad]
GO
ALTER TABLE [dbo].[solicitud] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[solicitud] ADD  DEFAULT (getdate()) FOR [fecha_actualizacion]
GO
ALTER TABLE [dbo].[sustancia_controlada] ADD  DEFAULT ((1)) FOR [requiere_licencia_importacion]
GO
ALTER TABLE [dbo].[sustancia_controlada] ADD  DEFAULT ((1)) FOR [requiere_licencia_uso]
GO
ALTER TABLE [dbo].[sustancia_controlada] ADD  DEFAULT ('ACTIVA') FOR [estado_sustancia]
GO
ALTER TABLE [dbo].[sustancia_controlada] ADD  DEFAULT (getdate()) FOR [fecha_creacion]
GO
ALTER TABLE [dbo].[sustancia_solicitud] ADD  DEFAULT (getdate()) FOR [fecha_agregacion]
GO
ALTER TABLE [dbo].[tipo_servicio] ADD  DEFAULT ((1)) FOR [requiere_costo_administrativo]
GO
ALTER TABLE [dbo].[tipo_servicio] ADD  DEFAULT ((10)) FOR [dias_respuesta]
GO
ALTER TABLE [dbo].[tipo_servicio] ADD  DEFAULT ('ACTIVO') FOR [estado_servicio]
GO
ALTER TABLE [dbo].[tipo_tramite] ADD  DEFAULT ((1)) FOR [requiere_costo]
GO
ALTER TABLE [dbo].[actividad_establecimiento]  WITH CHECK ADD FOREIGN KEY([id_establecimiento])
REFERENCES [dbo].[establecimiento] ([id_establecimiento])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[archivo_adjunto]  WITH CHECK ADD FOREIGN KEY([id_empleado_revision])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[archivo_adjunto]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[certificado_emitido]  WITH CHECK ADD FOREIGN KEY([id_empleado_firma])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[certificado_emitido]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[contacto_establecimiento]  WITH CHECK ADD FOREIGN KEY([id_establecimiento])
REFERENCES [dbo].[establecimiento] ([id_establecimiento])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[establecimiento]  WITH CHECK ADD FOREIGN KEY([id_solicitante])
REFERENCES [dbo].[solicitante] ([id_solicitante])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[formulario_requisito]  WITH CHECK ADD  CONSTRAINT [fk_requisito_tipo_servicio] FOREIGN KEY([id_tipo_servicio])
REFERENCES [dbo].[tipo_servicio] ([id_tipo_servicio])
GO
ALTER TABLE [dbo].[formulario_requisito] CHECK CONSTRAINT [fk_requisito_tipo_servicio]
GO
ALTER TABLE [dbo].[formulario_requisito]  WITH CHECK ADD  CONSTRAINT [fk_requisito_tipo_tramite] FOREIGN KEY([id_tipo_tramite])
REFERENCES [dbo].[tipo_tramite] ([id_tipo_tramite])
GO
ALTER TABLE [dbo].[formulario_requisito] CHECK CONSTRAINT [fk_requisito_tipo_tramite]
GO
ALTER TABLE [dbo].[historial_estado_solicitud]  WITH CHECK ADD FOREIGN KEY([id_empleado_cambio])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[historial_estado_solicitud]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pago]  WITH CHECK ADD FOREIGN KEY([id_empleado_verificador])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[pago]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[profesional]  WITH CHECK ADD FOREIGN KEY([id_solicitante])
REFERENCES [dbo].[solicitante] ([id_solicitante])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[revision_campo_solicitud]  WITH CHECK ADD FOREIGN KEY([id_empleado_revision])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[revision_campo_solicitud]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD FOREIGN KEY([id_empleado_asignado])
REFERENCES [dbo].[empleado] ([id_empleado])
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD FOREIGN KEY([id_solicitante])
REFERENCES [dbo].[solicitante] ([id_solicitante])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD FOREIGN KEY([id_tipo_servicio])
REFERENCES [dbo].[tipo_servicio] ([id_tipo_servicio])
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD FOREIGN KEY([id_tipo_tramite])
REFERENCES [dbo].[tipo_tramite] ([id_tipo_tramite])
GO
ALTER TABLE [dbo].[sustancia_controlada]  WITH CHECK ADD FOREIGN KEY([id_categoria])
REFERENCES [dbo].[categoria_droga] ([id_categoria])
GO
ALTER TABLE [dbo].[sustancia_solicitud]  WITH CHECK ADD FOREIGN KEY([id_solicitud])
REFERENCES [dbo].[solicitud] ([id_solicitud])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[sustancia_solicitud]  WITH CHECK ADD FOREIGN KEY([id_sustancia])
REFERENCES [dbo].[sustancia_controlada] ([id_sustancia])
GO
ALTER TABLE [dbo].[tipo_tramite]  WITH CHECK ADD FOREIGN KEY([id_tipo_servicio])
REFERENCES [dbo].[tipo_servicio] ([id_tipo_servicio])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[auditoria_cambios]  WITH CHECK ADD  CONSTRAINT [ck_tipo_operacion] CHECK  (([tipo_operacion]='DELETE' OR [tipo_operacion]='UPDATE' OR [tipo_operacion]='INSERT'))
GO
ALTER TABLE [dbo].[auditoria_cambios] CHECK CONSTRAINT [ck_tipo_operacion]
GO
ALTER TABLE [dbo].[certificado_emitido]  WITH CHECK ADD  CONSTRAINT [ck_estado_certificado] CHECK  (([estado_certificado]='CANCELADO' OR [estado_certificado]='REVOCADO' OR [estado_certificado]='VENCIDO' OR [estado_certificado]='ACTIVO'))
GO
ALTER TABLE [dbo].[certificado_emitido] CHECK CONSTRAINT [ck_estado_certificado]
GO
ALTER TABLE [dbo].[contacto_establecimiento]  WITH CHECK ADD  CONSTRAINT [ck_tipo_contacto] CHECK  (([tipo_contacto]='AGENTE_ADUANERO' OR [tipo_contacto]='ADMINISTRADOR' OR [tipo_contacto]='REGENTE_FARMACEUTICO'))
GO
ALTER TABLE [dbo].[contacto_establecimiento] CHECK CONSTRAINT [ck_tipo_contacto]
GO
ALTER TABLE [dbo].[empleado]  WITH CHECK ADD  CONSTRAINT [ck_rol] CHECK  (([rol]='ADMIN' OR [rol]='DNCD' OR [rol]='DIRECCION' OR [rol]='ENCARGADO_UPC' OR [rol]='TECNICO_UPC' OR [rol]='VENTANILLA'))
GO
ALTER TABLE [dbo].[empleado] CHECK CONSTRAINT [ck_rol]
GO
ALTER TABLE [dbo].[establecimiento]  WITH CHECK ADD  CONSTRAINT [ck_tipo_entidad] CHECK  (([tipo_entidad]='PUBLICA' OR [tipo_entidad]='PRIVADA'))
GO
ALTER TABLE [dbo].[establecimiento] CHECK CONSTRAINT [ck_tipo_entidad]
GO
ALTER TABLE [dbo].[log_acceso_sistema]  WITH CHECK ADD  CONSTRAINT [ck_tipo_acceso] CHECK  (([tipo_acceso]='ERROR_AUTENTICACION' OR [tipo_acceso]='ACCESO_PAGINA' OR [tipo_acceso]='LOGOUT' OR [tipo_acceso]='LOGIN'))
GO
ALTER TABLE [dbo].[log_acceso_sistema] CHECK CONSTRAINT [ck_tipo_acceso]
GO
ALTER TABLE [dbo].[pago]  WITH CHECK ADD  CONSTRAINT [ck_estado_pago] CHECK  (([estado_pago]='REEMBOLSO' OR [estado_pago]='RECHAZADO' OR [estado_pago]='CONFIRMADO' OR [estado_pago]='PENDIENTE'))
GO
ALTER TABLE [dbo].[pago] CHECK CONSTRAINT [ck_estado_pago]
GO
ALTER TABLE [dbo].[profesional]  WITH CHECK ADD  CONSTRAINT [ck_profesion] CHECK  (([profesion]='OTRA' OR [profesion]='ODONTOLOGIA' OR [profesion]='MEDICINA_VETERINARIA' OR [profesion]='MEDICINA'))
GO
ALTER TABLE [dbo].[profesional] CHECK CONSTRAINT [ck_profesion]
GO
ALTER TABLE [dbo].[revision_campo_solicitud]  WITH CHECK ADD  CONSTRAINT [ck_estado_campo_revision] CHECK  (([estado_campo]='OBSERVADO' OR [estado_campo]='CUMPLE' OR [estado_campo]='PENDIENTE'))
GO
ALTER TABLE [dbo].[revision_campo_solicitud] CHECK CONSTRAINT [ck_estado_campo_revision]
GO
ALTER TABLE [dbo].[solicitante]  WITH CHECK ADD  CONSTRAINT [ck_tipo_solicitante] CHECK  (([tipo_solicitante]='IMPORTADORA' OR [tipo_solicitante]='INSTITUCION_PUBLICA' OR [tipo_solicitante]='ESTABLECIMIENTO_PRIVADO' OR [tipo_solicitante]='PROFESIONAL'))
GO
ALTER TABLE [dbo].[solicitante] CHECK CONSTRAINT [ck_tipo_solicitante]
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD  CONSTRAINT [ck_estado_solicitud] CHECK  (([estado_solicitud]='COMPLETADA' OR [estado_solicitud]='CERTIFICADO_EMITIDO' OR [estado_solicitud]='RESOLUCION_EMITIDA' OR [estado_solicitud]='DENEGADA' OR [estado_solicitud]='RECHAZADA' OR [estado_solicitud]='APROBADA' OR [estado_solicitud]='PAGO_CONFIRMADO' OR [estado_solicitud]='PENDIENTE_PAGO' OR [estado_solicitud]='DEVUELTA_DNCD' OR [estado_solicitud]='EN_DNCD' OR [estado_solicitud]='DEVUELTA_DIRECCION' OR [estado_solicitud]='EN_DIRECCION' OR [estado_solicitud]='DEVUELTA_UPC' OR [estado_solicitud]='EN_UPC' OR [estado_solicitud]='EN_ENCARGADO_UPC' OR [estado_solicitud]='EN_REVISION_UPC' OR [estado_solicitud]='VALIDADA' OR [estado_solicitud]='DEVUELTA_VENTANILLA' OR [estado_solicitud]='EN_VENTANILLA' OR [estado_solicitud]='REGISTRADA' OR [estado_solicitud]='CREADA'))
GO
ALTER TABLE [dbo].[solicitud] CHECK CONSTRAINT [ck_estado_solicitud]
GO
ALTER TABLE [dbo].[solicitud]  WITH CHECK ADD  CONSTRAINT [ck_prioridad] CHECK  (([prioridad]='URGENTE' OR [prioridad]='ALTA' OR [prioridad]='NORMAL' OR [prioridad]='BAJA'))
GO
ALTER TABLE [dbo].[solicitud] CHECK CONSTRAINT [ck_prioridad]
GO
ALTER TABLE [dbo].[sustancia_controlada]  WITH CHECK ADD  CONSTRAINT [ck_restriccion] CHECK  (([nivel_restriccion]>=(1) AND [nivel_restriccion]<=(5)))
GO
ALTER TABLE [dbo].[sustancia_controlada] CHECK CONSTRAINT [ck_restriccion]
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_actualizar_revision]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_actualizar_revision]
  @id_archivo INT,
  @estado_archivo VARCHAR(50),
  @comentario_revision NVARCHAR(MAX) = NULL,
  @id_empleado_revision INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE archivo_adjunto
  SET
    estado_archivo = @estado_archivo,
    comentario_revision = @comentario_revision,
    id_empleado_revision = @id_empleado_revision,
    fecha_revision = GETDATE()
  WHERE id_archivo = @id_archivo;

  EXEC dbo.sp_archivo_obtener_por_id @id_archivo = @id_archivo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_crear]
  @id_solicitud INT,
  @nombre_archivo VARCHAR(255),
  @tipo_archivo VARCHAR(50),
  @ruta_almacenamiento VARCHAR(500),
  @tamano_bytes INT = NULL,
  @mime_type VARCHAR(50) = NULL,
  @hash_sha256 VARCHAR(64) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO archivo_adjunto (
    id_solicitud,
    nombre_archivo,
    tipo_archivo,
    ruta_almacenamiento,
    tamano_bytes,
    mime_type,
    hash_sha256,
    estado_archivo
  ) VALUES (
    @id_solicitud,
    @nombre_archivo,
    @tipo_archivo,
    @ruta_almacenamiento,
    @tamano_bytes,
    @mime_type,
    @hash_sha256,
    'PENDIENTE_REVISION'
  );

  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_archivo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_eliminar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_eliminar]
  @id_archivo INT
AS
BEGIN
  SET NOCOUNT ON;

  DELETE FROM archivo_adjunto WHERE id_archivo = @id_archivo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_estadisticas_tipo]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_estadisticas_tipo]
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    COALESCE(tipo_archivo, 'SIN_CLASIFICAR') AS tipo_archivo,
    COUNT(*) AS total_archivos,
    SUM(tamano_bytes) AS tamano_total_bytes
  FROM archivo_adjunto
  GROUP BY tipo_archivo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_listar_filtros]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_listar_filtros]
  @tipo_archivo VARCHAR(50) = NULL,
  @estado_archivo VARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_archivo,
    id_solicitud,
    nombre_archivo,
    tipo_archivo,
    tamano_bytes,
    estado_archivo,
    CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
  FROM archivo_adjunto
  WHERE (@tipo_archivo IS NULL OR tipo_archivo = @tipo_archivo)
    AND (@estado_archivo IS NULL OR estado_archivo = @estado_archivo)
  ORDER BY fecha_carga DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_obtener_por_id]
  @id_archivo INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_archivo,
    id_solicitud,
    nombre_archivo,
    tipo_archivo,
    ruta_almacenamiento,
    tamano_bytes,
    mime_type,
    hash_sha256,
    estado_archivo,
    comentario_revision,
    id_empleado_revision,
    CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
    CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
  FROM archivo_adjunto
  WHERE id_archivo = @id_archivo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_obtener_por_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_obtener_por_solicitud]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_archivo,
    id_solicitud,
    nombre_archivo,
    tipo_archivo,
    ruta_almacenamiento,
    tamano_bytes,
    mime_type,
    hash_sha256,
    estado_archivo,
    comentario_revision,
    id_empleado_revision,
    CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
    CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
  FROM archivo_adjunto
  WHERE id_solicitud = @id_solicitud
  ORDER BY fecha_carga DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_obtener_por_solicitud_tipo]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_obtener_por_solicitud_tipo]
  @id_solicitud INT,
  @tipo_archivo VARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_archivo,
    id_solicitud,
    nombre_archivo,
    tipo_archivo,
    ruta_almacenamiento,
    tamano_bytes,
    mime_type,
    hash_sha256,
    estado_archivo,
    comentario_revision,
    id_empleado_revision,
    CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision,
    CONVERT(VARCHAR(30), fecha_carga, 121) AS fecha_carga
  FROM archivo_adjunto
  WHERE id_solicitud = @id_solicitud
    AND tipo_archivo = @tipo_archivo
  ORDER BY fecha_carga DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_archivo_resumen_estados]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_archivo_resumen_estados]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN estado_archivo = 'CUMPLE' THEN 1 ELSE 0 END) AS cumpliendo,
    SUM(CASE WHEN estado_archivo = 'NO_CUMPLE' THEN 1 ELSE 0 END) AS no_cumpliendo,
    SUM(CASE WHEN estado_archivo = 'PENDIENTE_REVISION' THEN 1 ELSE 0 END) AS pendiente
  FROM archivo_adjunto
  WHERE id_solicitud = @id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_auditoria_registrar_cambio]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_auditoria_registrar_cambio]
  @tabla_afectada VARCHAR(50),
  @id_registro INT = NULL,
  @tipo_operacion VARCHAR(20),
  @valores_anteriores NVARCHAR(MAX) = NULL,
  @valores_nuevos NVARCHAR(MAX) = NULL,
  @id_usuario INT = NULL,
  @tipo_usuario VARCHAR(20) = NULL,
  @ip_origen VARCHAR(45) = NULL,
  @navegador_user_agent VARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO auditoria_cambios (
    tabla_afectada, id_registro, tipo_operacion, valores_anteriores,
    valores_nuevos, id_usuario, tipo_usuario, ip_origen, navegador_user_agent
  ) VALUES (
    @tabla_afectada, @id_registro, @tipo_operacion, @valores_anteriores,
    @valores_nuevos, @id_usuario, @tipo_usuario, @ip_origen, @navegador_user_agent
  );
  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_auditoria;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_actualizar_estado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_certificado_actualizar_estado]
    @id_certificado INT,
    @estado_certificado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @estado_certificado NOT IN ('ACTIVO', 'VENCIDO', 'REVOCADO', 'CANCELADO')
    BEGIN
        THROW 50040, 'Estado de certificado inválido.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50041, 'Certificado no encontrado.', 1;
    END;

    UPDATE certificado_emitido
    SET estado_certificado = @estado_certificado
    WHERE id_certificado = @id_certificado;

    SELECT
        id_certificado,
        id_solicitud,
        numero_certificado,
        fecha_emision,
        estado_certificado
    FROM certificado_emitido
    WHERE id_certificado = @id_certificado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_descargar_info]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_certificado_descargar_info]
    @id_certificado INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50050, 'Certificado no encontrado.', 1;
    END;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        s.numero_expediente,
        s.id_solicitante
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @id_certificado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_estadisticas]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_certificado_estadisticas]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        estado_certificado AS estado,
        COUNT(*) AS total
    FROM certificado_emitido
    GROUP BY estado_certificado
    ORDER BY total DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_generar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_certificado_generar]
    @id_solicitud INT,
    @numero_certificado VARCHAR(50) = NULL,
    @tipo_certificado VARCHAR(50) = 'CIDC_CLASE_A',
    @fecha_vencimiento DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_solicitud IS NULL
    BEGIN
        THROW 50020, 'El parámetro @id_solicitud es obligatorio.', 1;
    END;

    DECLARE @estado_solicitud VARCHAR(50);
    DECLARE @numero_expediente VARCHAR(50);

    SELECT
        @estado_solicitud = estado_solicitud,
        @numero_expediente = numero_expediente
    FROM solicitud
    WHERE id_solicitud = @id_solicitud;

    IF @estado_solicitud IS NULL
    BEGIN
        THROW 50021, 'Solicitud no encontrada.', 1;
    END;

    IF @estado_solicitud <> 'PAGO_CONFIRMADO'
    BEGIN
        THROW 50022, 'La solicitud debe tener pago confirmado para generar un certificado.', 1;
    END;

    IF EXISTS (SELECT 1 FROM certificado_emitido WHERE id_solicitud = @id_solicitud)
    BEGIN
        THROW 50023, 'Ya existe un certificado asociado a esta solicitud.', 1;
    END;

    DECLARE @numero_final VARCHAR(50) =
        CASE
            WHEN @numero_certificado IS NULL OR LTRIM(RTRIM(@numero_certificado)) = ''
                THEN 'CERT-' + CONVERT(VARCHAR(20), CONVERT(BIGINT, DATEDIFF_BIG(MICROSECOND, '2000-01-01', SYSUTCDATETIME())))
            ELSE @numero_certificado
        END;

    IF EXISTS (SELECT 1 FROM certificado_emitido WHERE numero_certificado = @numero_final)
    BEGIN
        THROW 50024, 'El número de certificado ya existe.', 1;
    END;

    DECLARE @fecha_venc DATE = ISNULL(@fecha_vencimiento, CAST(GETDATE() AS DATE));

    INSERT INTO certificado_emitido (
        id_solicitud,
        numero_certificado,
        tipo_certificado,
        fecha_vencimiento,
        estado_certificado
    ) VALUES (
        @id_solicitud,
        @numero_final,
        @tipo_certificado,
        @fecha_venc,
        'ACTIVO'
    );

    DECLARE @nuevo_id INT = SCOPE_IDENTITY();

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        s.numero_expediente
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @nuevo_id;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_listar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_certificado_listar]
    @estado VARCHAR(20) = NULL,
    @fechaDesde DATETIME = NULL,
    @fechaHasta DATETIME = NULL,
    @tipo_certificado VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        ISNULL(c.num_resolucion, c.numero_certificado) AS num_resolucion,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        c.estado_certificado AS estado,
        s.numero_expediente,
        s.numero_solicitud,
        s.id_solicitante,
        s.estado_solicitud
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE (@estado IS NULL OR c.estado_certificado = @estado)
      AND (@tipo_certificado IS NULL OR c.tipo_certificado = @tipo_certificado)
      AND (@fechaDesde IS NULL OR c.fecha_emision >= @fechaDesde)
      AND (@fechaHasta IS NULL OR c.fecha_emision <= @fechaHasta)
    ORDER BY c.fecha_emision DESC, c.id_certificado DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_obtener]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_certificado_obtener]
    @id_certificado INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM certificado_emitido WHERE id_certificado = @id_certificado)
    BEGIN
        THROW 50030, 'Certificado no encontrado.', 1;
    END;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        s.numero_expediente,
        s.estado_solicitud
    FROM certificado_emitido c
    JOIN solicitud s ON s.id_solicitud = c.id_solicitud
    WHERE c.id_certificado = @id_certificado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_certificado_obtener_por_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_certificado_obtener_por_solicitud]
    @id_solicitud INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.id_certificado,
        c.id_solicitud,
        c.numero_certificado,
        ISNULL(c.num_resolucion, c.numero_certificado) AS num_resolucion,
        c.tipo_certificado,
        c.fecha_emision,
        c.fecha_vencimiento,
        c.estado_certificado,
        c.estado_certificado AS estado,
        c.ruta_pdf,
        c.ruta_pdf_firmado,
        c.hash_pdf,
        c.firma_digital_certificado,
        c.id_empleado_firma,
        c.fecha_firma,
        c.datos_certificado,
        c.observaciones
    FROM certificado_emitido c
    WHERE c.id_solicitud = @id_solicitud
    ORDER BY c.fecha_emision DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_actualizar_datos]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_actualizar_datos]
  @id_empleado INT,
  @nombre_completo VARCHAR(255) = NULL,
  @rol VARCHAR(50) = NULL,
  @departamento VARCHAR(100) = NULL,
  @estado_empleado VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE empleado
  SET
    nombre_completo = COALESCE(@nombre_completo, nombre_completo),
    rol = COALESCE(@rol, rol),
    departamento = COALESCE(@departamento, departamento),
    estado_empleado = COALESCE(@estado_empleado, estado_empleado)
  WHERE id_empleado = @id_empleado;

  IF @@ROWCOUNT = 0
  BEGIN
    RETURN;
  END;

  EXEC dbo.sp_empleado_obtener_por_id @id_empleado = @id_empleado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_actualizar_password]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_actualizar_password]
  @id_empleado INT,
  @password_hash VARCHAR(255),
  @password_temporal BIT = 0
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE empleado
  SET
    password_hash = @password_hash,
    password_temporal = @password_temporal
  WHERE id_empleado = @id_empleado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_confirmar_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_confirmar_email]
  @id_empleado INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE empleado
  SET
    email_confirmado = 1,
    token_confirmacion = NULL,
    token_confirmacion_expira = NULL
  WHERE id_empleado = @id_empleado;

  SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_crear]
  @nombre_completo VARCHAR(255),
  @cedula VARCHAR(20),
  @email VARCHAR(255),
  @password_hash VARCHAR(255),
  @rol VARCHAR(50),
  @departamento VARCHAR(100) = NULL,
  @estado_empleado VARCHAR(20) = 'ACTIVO',
  @token_confirmacion VARCHAR(128) = NULL,
  @token_confirmacion_expira DATETIME = NULL,
  @password_temporal BIT = 1
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO empleado (
    nombre_completo,
    cedula,
    email,
    password_hash,
    rol,
    departamento,
    estado_empleado,
    fecha_ingreso,
    email_confirmado,
    token_confirmacion,
    token_confirmacion_expira,
    password_temporal
  ) VALUES (
    @nombre_completo,
    @cedula,
    @email,
    @password_hash,
    @rol,
    COALESCE(@departamento, ''),
    @estado_empleado,
    GETDATE(),
    0,
    @token_confirmacion,
    @token_confirmacion_expira,
    @password_temporal
  );

  DECLARE @nuevo_id INT = SCOPE_IDENTITY();
  EXEC dbo.sp_empleado_obtener_por_id @id_empleado = @nuevo_id;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_eliminar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_eliminar]
  @id_empleado INT
AS
BEGIN
  SET NOCOUNT ON;

  DELETE FROM empleado WHERE id_empleado = @id_empleado;
  SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_listar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_listar]
  @rol VARCHAR(50) = NULL,
  @departamento VARCHAR(100) = NULL,
  @estado_empleado VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    nombre_completo,
    email,
    rol,
    departamento,
    estado_empleado,
    fecha_ingreso,
    fecha_creacion
  FROM empleado
  WHERE (@rol IS NULL OR rol = @rol)
    AND (@departamento IS NULL OR departamento = @departamento)
    AND (@estado_empleado IS NULL OR estado_empleado = @estado_empleado)
  ORDER BY nombre_completo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_obtener_password_hash]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_obtener_password_hash]
  @id_empleado INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    password_hash,
    password_temporal
  FROM empleado
  WHERE id_empleado = @id_empleado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_obtener_por_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_obtener_por_email]
  @email VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    nombre_completo,
    email,
    cedula,
    rol,
    departamento,
    estado_empleado,
    password_hash,
    email_confirmado,
    password_temporal
  FROM empleado
  WHERE email = @email;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_obtener_por_id]
  @id_empleado INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    nombre_completo,
    email,
    cedula,
    rol,
    departamento,
    estado_empleado,
    fecha_ingreso,
    fecha_creacion,
    email_confirmado
  FROM empleado
  WHERE id_empleado = @id_empleado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_obtener_por_token_confirmacion]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_obtener_por_token_confirmacion]
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    email_confirmado,
    token_confirmacion_expira
  FROM empleado
  WHERE token_confirmacion = @token;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_obtener_por_token_reset]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_obtener_por_token_reset]
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_empleado,
    email,
    token_reset_expira
  FROM empleado
  WHERE token_reset_password = @token;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_registrar_token_reset]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_registrar_token_reset]
  @id_empleado INT,
  @token VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE empleado
  SET
    token_reset_password = @token,
    token_reset_expira = @expira
  WHERE id_empleado = @id_empleado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_restablecer_password]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_restablecer_password]
  @id_empleado INT,
  @password_hash VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE empleado
  SET
    password_hash = @password_hash,
    password_temporal = 0,
    token_reset_password = NULL,
    token_reset_expira = NULL,
    email_confirmado = 1
  WHERE id_empleado = @id_empleado;

  SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_empleado_validar_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_empleado_validar_email]
  @email VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT COUNT(1) AS total
  FROM empleado
  WHERE email = @email;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_estado_solicitud_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_estado_solicitud_crear]
  @nombre_estado VARCHAR(50),
  @descripcion NVARCHAR(255) = NULL,
  @orden_secuencial INT = 99,
  @es_estado_inicial BIT = 0,
  @es_estado_final BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO estado_solicitud_catalogo (
    nombre_estado, descripcion, orden_secuencial, es_estado_inicial, es_estado_final
  ) VALUES (
    @nombre_estado, COALESCE(@descripcion, CONCAT('Estado ', @nombre_estado)),
    @orden_secuencial, @es_estado_inicial, @es_estado_final
  );
  EXEC dbo.sp_estado_solicitud_obtener_por_nombre @nombre_estado = @nombre_estado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_estado_solicitud_obtener_por_nombre]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_estado_solicitud_obtener_por_nombre]
  @nombre_estado VARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 *
  FROM estado_solicitud_catalogo
  WHERE nombre_estado = @nombre_estado;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_formulario_requisito_guardar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_formulario_requisito_guardar]
    @id_requisito INT = NULL,
    @id_tipo_servicio INT = NULL,
    @id_tipo_tramite INT = NULL,
    @nombre_corto VARCHAR(150),
    @descripcion NVARCHAR(500) = NULL,
    @es_obligatorio BIT = 1,
    @tipo_input VARCHAR(50) = 'archivo',
    @tipo_archivo_permitido VARCHAR(100) = NULL,
    @tamano_max_mb INT = NULL,
    @orden_visual INT = 1,
    @activo BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @id_requisito IS NULL
    BEGIN
        INSERT INTO dbo.formulario_requisito (
            id_tipo_servicio, id_tipo_tramite, nombre_corto, descripcion,
            es_obligatorio, tipo_input, tipo_archivo_permitido, tamano_max_mb,
            orden_visual, activo
        ) VALUES (
            @id_tipo_servicio, @id_tipo_tramite, @nombre_corto, @descripcion,
            @es_obligatorio, @tipo_input, @tipo_archivo_permitido, @tamano_max_mb,
            @orden_visual, @activo
        );

        SET @id_requisito = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.formulario_requisito
        SET
            id_tipo_servicio = @id_tipo_servicio,
            id_tipo_tramite = @id_tipo_tramite,
            nombre_corto = @nombre_corto,
            descripcion = @descripcion,
            es_obligatorio = @es_obligatorio,
            tipo_input = @tipo_input,
            tipo_archivo_permitido = @tipo_archivo_permitido,
            tamano_max_mb = @tamano_max_mb,
            orden_visual = @orden_visual,
            activo = @activo,
            fecha_actualizacion = GETDATE()
        WHERE id_requisito = @id_requisito;
    END

    EXEC dbo.sp_formulario_requisito_listar
        @id_tipo_servicio = @id_tipo_servicio,
        @id_tipo_tramite = @id_tipo_tramite,
        @solo_activos = 0;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_formulario_requisito_listar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_formulario_requisito_listar]
    @id_tipo_servicio INT = NULL,
    @id_tipo_tramite INT = NULL,
    @solo_activos BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        id_requisito,
        id_tipo_servicio,
        id_tipo_tramite,
        nombre_corto,
        descripcion,
        es_obligatorio,
        tipo_input,
        tipo_archivo_permitido,
        tamano_max_mb,
        orden_visual,
        activo
    FROM dbo.formulario_requisito
    WHERE (@id_tipo_servicio IS NULL OR id_tipo_servicio = @id_tipo_servicio)
      AND (@id_tipo_tramite IS NULL OR id_tipo_tramite = @id_tipo_tramite)
      AND (@solo_activos = 0 OR activo = 1)
    ORDER BY orden_visual, nombre_corto;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_historial_estado_registrar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_historial_estado_registrar]
  @id_solicitud INT,
  @estado_anterior VARCHAR(50) = NULL,
  @estado_nuevo VARCHAR(50),
  @id_empleado_cambio INT = NULL,
  @motivo_cambio NVARCHAR(MAX) = NULL,
  @unidad_origen VARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO historial_estado_solicitud (
    id_solicitud, estado_anterior, estado_nuevo, id_empleado_cambio,
    motivo_cambio, comentario_adicional
  ) VALUES (
    @id_solicitud, @estado_anterior, @estado_nuevo, @id_empleado_cambio,
    @motivo_cambio, @unidad_origen
  );
  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_historial;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_log_acceso_registrar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_log_acceso_registrar]
    @tipo_acceso VARCHAR(50),
    @tipo_usuario VARCHAR(20),
    @id_usuario INT = NULL,
    @email_usuario VARCHAR(255) = NULL,
    @resultado VARCHAR(20) = 'EXITOSO',
    @motivo_fallo VARCHAR(500) = NULL,
    @ip_origen VARCHAR(45) = NULL,
    @navegador_user_agent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF UPPER(ISNULL(@tipo_usuario, '')) <> 'EMPLEADO'
    BEGIN
        THROW 70010, 'log_acceso_sistema es exclusivo para usuarios empleados.', 1;
    END;

    INSERT INTO log_acceso_sistema (
        id_usuario,
        tipo_usuario,
        email_usuario,
        tipo_acceso,
        resultado,
        motivo_fallo,
        ip_origen,
        navegador_user_agent
    ) VALUES (
        @id_usuario,
        @tipo_usuario,
        @email_usuario,
        @tipo_acceso,
        UPPER(@resultado),
        @motivo_fallo,
        @ip_origen,
        @navegador_user_agent
    );

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_log;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_pago_actualizar_estado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_pago_actualizar_estado]
  @id_pago INT,
  @estado_pago VARCHAR(20),
  @numero_comprobante VARCHAR(50) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE pago
  SET estado_pago = @estado_pago,
      numero_comprobante = @numero_comprobante,
      fecha_confirmacion = CASE WHEN @estado_pago = 'PENDIENTE' THEN fecha_confirmacion ELSE GETDATE() END
  WHERE id_pago = @id_pago;

  SELECT @id_pago AS id_pago, @estado_pago AS estado_pago;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_pago_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_pago_crear]
  @id_solicitud INT,
  @monto_total DECIMAL(18, 2),
  @forma_pago VARCHAR(50),
  @referencia_pago VARCHAR(100) = NULL,
  @monto_costo_administrativo DECIMAL(18, 2) = NULL,
  @monto_tramite DECIMAL(18, 2) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO pago (
    id_solicitud,
    monto_total,
    monto_costo_administrativo,
    monto_tramite,
    forma_pago,
    referencia_pago,
    estado_pago,
    fecha_vencimiento
  ) VALUES (
    @id_solicitud,
    @monto_total,
    COALESCE(@monto_costo_administrativo, 0),
    COALESCE(@monto_tramite, 0),
    @forma_pago,
    @referencia_pago,
    'PENDIENTE',
    DATEADD(day, 5, GETDATE())
  );

  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_pago;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_pago_listar_pendientes]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_pago_listar_pendientes]
AS
BEGIN
  SET NOCOUNT ON;

  SELECT p.*, s.numero_solicitud, sol.email AS email_solicitante
  FROM pago p
  JOIN solicitud s ON p.id_solicitud = s.id_solicitud
  JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
  WHERE p.estado_pago = 'PENDIENTE'
  ORDER BY p.fecha_creacion DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_pago_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_pago_obtener_por_id]
  @id_pago INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_pago,
    id_solicitud,
    monto_total,
    monto_costo_administrativo,
    monto_tramite,
    estado_pago,
    CONVERT(VARCHAR(10), fecha_vencimiento, 121) AS fecha_vencimiento,
    forma_pago,
    referencia_pago,
    numero_comprobante,
    id_empleado_verificador,
    CONVERT(VARCHAR(30), fecha_creacion, 121) AS fecha_creacion,
    CONVERT(VARCHAR(30), fecha_confirmacion, 121) AS fecha_confirmacion
  FROM pago
  WHERE id_pago = @id_pago;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_pago_obtener_por_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_pago_obtener_por_solicitud]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1
    id_pago,
    id_solicitud,
    monto_total,
    monto_costo_administrativo,
    monto_tramite,
    estado_pago,
    CONVERT(VARCHAR(10), fecha_vencimiento, 121) AS fecha_vencimiento,
    forma_pago,
    referencia_pago,
    numero_comprobante,
    id_empleado_verificador,
    CONVERT(VARCHAR(30), fecha_creacion, 121) AS fecha_creacion,
    CONVERT(VARCHAR(30), fecha_confirmacion, 121) AS fecha_confirmacion
  FROM pago
  WHERE id_solicitud = @id_solicitud
  ORDER BY fecha_creacion DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_registro_solicitante_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_registro_solicitante_crear]
  @email VARCHAR(255),
  @datos_payload NVARCHAR(MAX),
  @token_confirmacion VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.solicitante_registro_pendiente (email, datos_payload, token_confirmacion, expira)
  OUTPUT INSERTED.id_registro,
         INSERTED.email,
         INSERTED.datos_payload,
         INSERTED.token_confirmacion,
         INSERTED.expira,
         INSERTED.creado_en
  VALUES (@email, @datos_payload, @token_confirmacion, @expira);
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_registro_solicitante_eliminar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_registro_solicitante_eliminar]
  @id_registro INT
AS
BEGIN
  SET NOCOUNT ON;

  DELETE FROM dbo.solicitante_registro_pendiente WHERE id_registro = @id_registro;
  SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_registro_solicitante_obtener_por_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_registro_solicitante_obtener_por_email]
  @email VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 *
  FROM dbo.solicitante_registro_pendiente
  WHERE email = @email;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_registro_solicitante_obtener_por_token]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_registro_solicitante_obtener_por_token]
  @token_confirmacion VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 *
  FROM dbo.solicitante_registro_pendiente
  WHERE token_confirmacion = @token_confirmacion;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_reporte_actividad_empleado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_actividad_empleado]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_archivos]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_archivos]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_general]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_general]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_pagos]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_pagos]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_solicitudes_por_estado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_solicitudes_por_estado]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_solicitudes_por_mes]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_solicitudes_por_mes]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_solicitudes_por_solicitante]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_solicitudes_por_solicitante]
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
/****** Object:  StoredProcedure [dbo].[sp_reporte_sustancias_solicitadas]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_reporte_sustancias_solicitadas]
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
/****** Object:  StoredProcedure [dbo].[sp_revision_campo_guardar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_revision_campo_guardar]
  @id_solicitud INT,
  @nombre_campo VARCHAR(100),
  @etiqueta_campo VARCHAR(255) = NULL,
  @valor_reportado NVARCHAR(MAX) = NULL,
  @estado_campo VARCHAR(20) = 'PENDIENTE',
  @comentario_revision NVARCHAR(MAX) = NULL,
  @id_empleado_revision INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  MERGE revision_campo_solicitud AS target
  USING (SELECT @id_solicitud AS id_solicitud, @nombre_campo AS nombre_campo) AS source
    ON target.id_solicitud = source.id_solicitud AND target.nombre_campo = source.nombre_campo
  WHEN MATCHED THEN
    UPDATE SET
      etiqueta_campo = @etiqueta_campo,
      valor_reportado = @valor_reportado,
      estado_campo = @estado_campo,
      comentario_revision = @comentario_revision,
      id_empleado_revision = @id_empleado_revision,
      fecha_revision = GETDATE()
  WHEN NOT MATCHED THEN
    INSERT (id_solicitud, nombre_campo, etiqueta_campo, valor_reportado, estado_campo, comentario_revision, id_empleado_revision, fecha_revision)
    VALUES (@id_solicitud, @nombre_campo, @etiqueta_campo, @valor_reportado, @estado_campo, @comentario_revision, @id_empleado_revision, GETDATE());

  SELECT TOP 1
    id_revision,
    id_solicitud,
    nombre_campo,
    etiqueta_campo,
    valor_reportado,
    estado_campo,
    comentario_revision,
    id_empleado_revision,
    CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision
  FROM revision_campo_solicitud
  WHERE id_solicitud = @id_solicitud AND nombre_campo = @nombre_campo;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_revision_campo_listar_por_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_revision_campo_listar_por_solicitud]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_revision,
    id_solicitud,
    nombre_campo,
    etiqueta_campo,
    valor_reportado,
    estado_campo,
    comentario_revision,
    id_empleado_revision,
    CONVERT(VARCHAR(30), fecha_revision, 121) AS fecha_revision
  FROM revision_campo_solicitud
  WHERE id_solicitud = @id_solicitud
  ORDER BY nombre_campo ASC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_seed_catalogos_basicos]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_seed_catalogos_basicos]
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
/****** Object:  StoredProcedure [dbo].[sp_solicitante_actualizar_password]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_actualizar_password]
  @id_solicitante INT,
  @password_hash VARCHAR(255)
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET password_hash = @password_hash,
      token_reset_password = NULL,
      token_reset_expira = NULL,
      email_confirmado = 1
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_actualizar_ultimo_acceso]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_actualizar_ultimo_acceso]
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET fecha_ultimo_acceso = GETDATE()
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_confirmar_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_confirmar_email]
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET email_confirmado = 1,
      token_confirmacion = NULL,
      token_confirmacion_expira = NULL
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_crear]
  @tipo_solicitante VARCHAR(50),
  @email VARCHAR(100),
  @password_hash VARCHAR(255),
  @telefono VARCHAR(20) = NULL,
  @nombre_completo VARCHAR(100) = NULL,
  @cedula_identidad VARCHAR(20) = NULL,
  @cedula_electoral VARCHAR(20) = NULL,
  @exequatur VARCHAR(20) = NULL,
  @profesion VARCHAR(100) = NULL,
  @numero_colegiatura VARCHAR(50) = NULL,
  @codigo_colegio VARCHAR(20) = NULL,
  @direccion_postal VARCHAR(255) = NULL,
  @telefono_residencial VARCHAR(20) = NULL,
  @telefono_celular VARCHAR(20) = NULL,
  @lugar_trabajo VARCHAR(100) = NULL,
  @email_trabajo VARCHAR(100) = NULL,
  @direccion_trabajo VARCHAR(255) = NULL,
  @telefono_trabajo VARCHAR(20) = NULL,
  @fecha_nacimiento DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO solicitante (
      tipo_solicitante,
      email,
      password_hash,
      telefono,
      estado_cuenta
    ) VALUES (
      @tipo_solicitante,
      @email,
      @password_hash,
      COALESCE(@telefono, ''),
      'ACTIVA'
    );

    DECLARE @id_solicitante INT = CAST(SCOPE_IDENTITY() AS INT);

    IF @tipo_solicitante = 'PROFESIONAL'
    BEGIN
      INSERT INTO profesional (
        id_solicitante,
        nombre_completo,
        cedula_identidad,
        cedula_electoral,
        exequatur,
        profesion,
        numero_colegiatura,
        codigo_colegio,
        direccion_postal,
        telefono_residencial,
        telefono_celular,
        lugar_trabajo,
        email_trabajo,
        direccion_trabajo,
        telefono_trabajo,
        fecha_nacimiento
      ) VALUES (
        @id_solicitante,
        COALESCE(@nombre_completo, ''),
        COALESCE(@cedula_identidad, ''),
        COALESCE(@cedula_electoral, ''),
        COALESCE(@exequatur, ''),
        COALESCE(@profesion, ''),
        COALESCE(@numero_colegiatura, ''),
        COALESCE(@codigo_colegio, ''),
        COALESCE(@direccion_postal, ''),
        COALESCE(@telefono_residencial, ''),
        COALESCE(@telefono_celular, ''),
        COALESCE(@lugar_trabajo, ''),
        COALESCE(@email_trabajo, ''),
        COALESCE(@direccion_trabajo, ''),
        COALESCE(@telefono_trabajo, ''),
        @fecha_nacimiento
      );
    END;

    COMMIT TRANSACTION;

    SELECT @id_solicitante AS id_solicitante;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_eliminar_si_no_confirmado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_eliminar_si_no_confirmado]
    @id_solicitante INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM solicitante
    WHERE id_solicitante = @id_solicitante
      AND email_confirmado = 0;

    SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_existe_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_existe_email]
  @email VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM solicitante WHERE email = @email
  ) THEN 1 ELSE 0 END AS existe;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_guardar_token_confirmacion]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_guardar_token_confirmacion]
  @id_solicitante INT,
  @token VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET token_confirmacion = @token,
      token_confirmacion_expira = @expira,
      email_confirmado = 0
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_guardar_token_reset]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_guardar_token_reset]
  @id_solicitante INT,
  @token VARCHAR(128),
  @expira DATETIME
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitante
  SET token_reset_password = @token,
      token_reset_expira = @expira
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_obtener_password_hash]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_obtener_password_hash]
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_solicitante,
    email,
    password_hash
  FROM solicitante
  WHERE id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_obtener_por_email]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_obtener_por_email]
  @email VARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1
    s.id_solicitante,
    s.tipo_solicitante,
    s.email,
    s.password_hash,
    s.telefono,
    s.estado_cuenta,
    s.fecha_registro,
    s.email_confirmado,
    s.token_confirmacion,
    s.token_confirmacion_expira,
    s.token_reset_password,
    s.token_reset_expira,
    p.nombre_completo,
    p.cedula_identidad,
    p.profesion
  FROM solicitante s
  LEFT JOIN profesional p ON s.id_solicitante = p.id_solicitante
  WHERE s.email = @email;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_obtener_por_id]
  @id_solicitante INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    s.id_solicitante,
    s.tipo_solicitante,
    s.email,
    s.telefono,
    s.estado_cuenta,
    s.fecha_registro,
    s.email_confirmado,
    p.nombre_completo,
    p.cedula_identidad,
    p.profesion
  FROM solicitante s
  LEFT JOIN profesional p ON s.id_solicitante = p.id_solicitante
  WHERE s.id_solicitante = @id_solicitante;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_obtener_por_token_confirmacion]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_obtener_por_token_confirmacion]
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 * FROM solicitante WHERE token_confirmacion = @token;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitante_obtener_por_token_reset]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitante_obtener_por_token_reset]
  @token VARCHAR(128)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1 * FROM solicitante WHERE token_reset_password = @token;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_actualizar_datos]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_actualizar_datos]
  @id_solicitud INT,
  @id_tipo_servicio INT,
  @id_tipo_tramite INT,
  @numero_cidc_anterior VARCHAR(50) = NULL,
  @motivo_detalle NVARCHAR(MAX) = NULL,
  @datos_servicio_json NVARCHAR(MAX) = NULL,
  @documentos_reportados_json NVARCHAR(MAX) = NULL,
  @resumen_pago_label NVARCHAR(150) = NULL,
  @monto_total_reportado DECIMAL(12, 2) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitud
  SET id_tipo_servicio = @id_tipo_servicio,
      id_tipo_tramite = @id_tipo_tramite,
      numero_cidc_anterior = @numero_cidc_anterior,
      motivo_detalle = @motivo_detalle,
      datos_servicio_json = @datos_servicio_json,
      documentos_reportados_json = @documentos_reportados_json,
      resumen_pago_label = @resumen_pago_label,
      monto_total_reportado = @monto_total_reportado,
      fecha_actualizacion = GETDATE()
  WHERE id_solicitud = @id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_agregar_sustancia]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_agregar_sustancia]
  @id_solicitud INT,
  @id_sustancia INT,
  @cantidad_solicitada DECIMAL(18, 3),
  @unidad_medida VARCHAR(20)
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO sustancia_solicitud (id_solicitud, id_sustancia, cantidad_solicitada, unidad_medida)
  VALUES (@id_solicitud, @id_sustancia, @cantidad_solicitada, @unidad_medida);

  SELECT CAST(SCOPE_IDENTITY() AS INT) AS id;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_cambiar_estado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_cambiar_estado]
  @id_solicitud INT,
  @estado_solicitud VARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE solicitud
  SET estado_solicitud = @estado_solicitud,
      fecha_actualizacion = GETDATE()
  WHERE id_solicitud = @id_solicitud
    AND ISNULL(estado_solicitud, '') <> @estado_solicitud;

  SELECT @@ROWCOUNT AS filas_afectadas;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_crear]
    @id_solicitante INT,
    @id_tipo_servicio INT,
    @id_tipo_tramite INT,
    @prioridad VARCHAR(20) = 'NORMAL',
    @fecha_vencimiento DATE = NULL,
    @id_empleado_asignado INT = NULL,
    @numero_cidc_anterior VARCHAR(50) = NULL,
    @motivo_detalle NVARCHAR(MAX) = NULL,
    @datos_servicio_json NVARCHAR(MAX) = NULL,
    @documentos_reportados_json NVARCHAR(MAX) = NULL,
    @resumen_pago_label NVARCHAR(150) = NULL,
    @monto_total_reportado DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @fecha_actual DATE = CAST(GETDATE() AS DATE);
    DECLARE @numero_expediente_base VARCHAR(40) = CONCAT('EXP-', FORMAT(@fecha_actual, 'yyyyMMdd'), '-');

    INSERT INTO solicitud (
        id_solicitante,
        id_tipo_servicio,
        id_tipo_tramite,
        numero_expediente,
        estado_solicitud,
        prioridad,
        fecha_vencimiento,
        id_empleado_asignado,
        numero_cidc_anterior,
        motivo_detalle,
        datos_servicio_json,
        documentos_reportados_json,
        resumen_pago_label,
        monto_total_reportado
    ) VALUES (
        @id_solicitante,
        @id_tipo_servicio,
        @id_tipo_tramite,
        CONCAT(@numero_expediente_base, 'PEND'),
        'CREADA',
        @prioridad,
        COALESCE(@fecha_vencimiento, DATEADD(day, 30, GETDATE())),
        @id_empleado_asignado,
        @numero_cidc_anterior,
        @motivo_detalle,
        @datos_servicio_json,
        @documentos_reportados_json,
        @resumen_pago_label,
        @monto_total_reportado
    );

    DECLARE @id_nueva_solicitud INT = CAST(SCOPE_IDENTITY() AS INT);
    DECLARE @sufijo_id VARCHAR(6) = RIGHT('000000' + CAST(@id_nueva_solicitud AS VARCHAR(6)), 6);
    DECLARE @numero_expediente_final VARCHAR(60) = CONCAT(@numero_expediente_base, @sufijo_id);

    UPDATE solicitud
    SET numero_expediente = @numero_expediente_final
    WHERE id_solicitud = @id_nueva_solicitud;

    SELECT @id_nueva_solicitud AS id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_eliminar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_eliminar]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  DELETE FROM solicitud WHERE id_solicitud = @id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_listar_por_estado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_listar_por_estado]
    @estado VARCHAR(50) = NULL,
    @id_solicitante INT = NULL,
    @skip INT = 0,
    @take INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    IF @take <= 0 SET @take = 20;
    IF @skip < 0 SET @skip = 0;

    WITH solicitudes_filtradas AS (
        SELECT
            s.id_solicitud,
            s.id_solicitante,
            s.id_tipo_servicio,
            s.id_tipo_tramite,
            s.numero_solicitud,
            s.numero_expediente,
            s.estado_solicitud AS estado_actual,
            s.prioridad,
            CONVERT(VARCHAR(30), s.fecha_creacion, 121) AS fecha_creacion,
            CONVERT(VARCHAR(30), s.fecha_actualizacion, 121) AS fecha_actualizacion,
            CONVERT(VARCHAR(10), s.fecha_vencimiento, 121) AS fecha_vencimiento,
            CONVERT(VARCHAR(10), s.fecha_creacion, 121) AS fecha_solicitud,
            ts.nombre_servicio,
            tt.nombre_tramite,
            s.comentario_general,
            s.id_empleado_asignado,
            s.numero_cidc_anterior,
            s.motivo_detalle,
            s.resumen_pago_label,
            s.monto_total_reportado,
            s.datos_servicio_json,
            s.documentos_reportados_json,
            sol.email AS email_solicitante,
            sol.telefono AS telefono_solicitante,
            sol.tipo_solicitante,
            COALESCE(prof.nombre_completo, est.razon_social) AS nombre_solicitante,
            COALESCE(prof.cedula_identidad, est.rnc) AS identificador_solicitante,
            COALESCE(prof.telefono_celular, est.telefono_empresa, sol.telefono) AS telefono_contacto,
            ultimo.estado_nuevo AS ultimo_estado,
            ultimo.fecha_cambio AS ultimo_cambio_fecha,
            ultimo.empleado_nombre AS ultimo_cambio_por,
            ROW_NUMBER() OVER (ORDER BY s.fecha_creacion DESC, s.id_solicitud DESC) AS rn
        FROM solicitud s
        LEFT JOIN tipo_servicio ts ON s.id_tipo_servicio = ts.id_tipo_servicio
        LEFT JOIN tipo_tramite tt ON s.id_tipo_tramite = tt.id_tipo_tramite
        LEFT JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
        LEFT JOIN profesional prof ON prof.id_solicitante = sol.id_solicitante
        LEFT JOIN establecimiento est ON est.id_solicitante = sol.id_solicitante
        OUTER APPLY (
            SELECT TOP 1
                h.estado_nuevo,
                CONVERT(VARCHAR(30), h.fecha_cambio, 121) AS fecha_cambio,
                e.nombre_completo AS empleado_nombre
            FROM historial_estado_solicitud h
            LEFT JOIN empleado e ON h.id_empleado_cambio = e.id_empleado
            WHERE h.id_solicitud = s.id_solicitud
            ORDER BY h.fecha_cambio DESC
        ) ultimo
        WHERE (@estado IS NULL OR s.estado_solicitud = @estado)
          AND (@id_solicitante IS NULL OR s.id_solicitante = @id_solicitante)
    )
    SELECT
        id_solicitud,
        id_solicitante,
        id_tipo_servicio,
        id_tipo_tramite,
        numero_solicitud,
        numero_expediente,
        estado_actual,
        prioridad,
        fecha_creacion,
        fecha_actualizacion,
        fecha_vencimiento,
        fecha_solicitud,
        nombre_servicio,
        nombre_tramite,
        comentario_general,
        id_empleado_asignado,
        numero_cidc_anterior,
        motivo_detalle,
        resumen_pago_label,
        monto_total_reportado,
        datos_servicio_json,
        documentos_reportados_json,
        email_solicitante,
        telefono_solicitante,
        tipo_solicitante,
        nombre_solicitante,
        identificador_solicitante,
        telefono_contacto,
        ultimo_estado,
        ultimo_cambio_fecha,
        ultimo_cambio_por
    FROM solicitudes_filtradas
    WHERE rn > @skip AND rn <= (@skip + @take)
    ORDER BY rn;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_obtener_historial]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_obtener_historial]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    h.id_historial,
    h.id_solicitud,
    h.estado_anterior,
    h.estado_nuevo,
    h.id_empleado_cambio,
    CONVERT(VARCHAR(30), h.fecha_cambio, 121) AS fecha_cambio,
    h.motivo_cambio,
    h.comentario_adicional,
    e.nombre_completo AS empleado_nombre,
    e.rol AS empleado_rol,
    e.email AS empleado_email
  FROM historial_estado_solicitud h
  LEFT JOIN empleado e ON e.id_empleado = h.id_empleado_cambio
  WHERE h.id_solicitud = @id_solicitud
  ORDER BY h.fecha_cambio DESC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_obtener_por_id]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    s.id_solicitud,
    s.id_solicitante,
    s.id_tipo_servicio,
    s.id_tipo_tramite,
    s.numero_expediente,
    s.estado_solicitud,
    s.prioridad,
    CONVERT(VARCHAR(30), s.fecha_creacion, 121) AS fecha_creacion,
    CONVERT(VARCHAR(30), s.fecha_actualizacion, 121) AS fecha_actualizacion,
    CONVERT(VARCHAR(10), s.fecha_vencimiento, 121) AS fecha_vencimiento,
    CONVERT(VARCHAR(30), s.fecha_envio_datos, 121) AS fecha_envio_datos,
    s.comentario_general,
    s.id_empleado_asignado,
    s.numero_cidc_anterior,
    s.motivo_detalle,
    s.datos_servicio_json,
    s.documentos_reportados_json,
    s.resumen_pago_label,
    s.monto_total_reportado,
    ts.nombre_servicio,
    tt.nombre_tramite,
    sol.email AS email_solicitante,
    sol.telefono AS telefono_solicitante,
    sol.tipo_solicitante,
    COALESCE(prof.nombre_completo, est.razon_social) AS nombre_solicitante,
    COALESCE(prof.cedula_identidad, est.rnc) AS identificador_solicitante,
    COALESCE(prof.telefono_celular, est.telefono_empresa, sol.telefono) AS telefono_contacto,
    prof.profesion AS profesion_solicitante,
    est.tipo_entidad AS tipo_entidad_solicitante
  FROM solicitud s
  LEFT JOIN solicitante sol ON s.id_solicitante = sol.id_solicitante
  LEFT JOIN profesional prof ON prof.id_solicitante = sol.id_solicitante
  LEFT JOIN establecimiento est ON est.id_solicitante = sol.id_solicitante
  LEFT JOIN tipo_servicio ts ON s.id_tipo_servicio = ts.id_tipo_servicio
  LEFT JOIN tipo_tramite tt ON s.id_tipo_tramite = tt.id_tipo_tramite
  WHERE s.id_solicitud = @id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_solicitud_obtener_sustancias]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_solicitud_obtener_sustancias]
  @id_solicitud INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT * FROM sustancia_solicitud WHERE id_solicitud = @id_solicitud;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_sustancia_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_sustancia_obtener_por_id]
  @id_sustancia INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 *
  FROM sustancia_controlada
  WHERE id_sustancia = @id_sustancia;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_sync_estado_solicitud]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_sync_estado_solicitud]
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
/****** Object:  StoredProcedure [dbo].[sp_tipo_servicio_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_servicio_crear]
  @nombre_servicio NVARCHAR(100),
  @descripcion NVARCHAR(500) = NULL,
  @requiere_costo BIT = 0,
  @costo_administrativo DECIMAL(10, 2) = NULL,
  @dias_respuesta INT = 0,
  @estado_servicio VARCHAR(20) = 'ACTIVO'
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO tipo_servicio (
    nombre_servicio,
    descripcion,
    requiere_costo_administrativo,
    costo_administrativo,
    dias_respuesta,
    estado_servicio
  ) VALUES (
    @nombre_servicio,
    @descripcion,
    @requiere_costo,
    @costo_administrativo,
    @dias_respuesta,
    @estado_servicio
  );

  DECLARE @id_tipo_servicio INT = CAST(SCOPE_IDENTITY() AS INT);

  EXEC dbo.sp_tipo_servicio_obtener_por_id @id_tipo_servicio = @id_tipo_servicio;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_servicio_listar]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_servicio_listar]
  @incluir_inactivos BIT = 0
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_tipo_servicio,
    nombre_servicio,
    descripcion,
    requiere_costo_administrativo,
    costo_administrativo,
    dias_respuesta,
    estado_servicio
  FROM tipo_servicio
  WHERE (@incluir_inactivos = 1) OR (estado_servicio = 'ACTIVO')
  ORDER BY nombre_servicio ASC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_servicio_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_servicio_obtener_por_id]
  @id_tipo_servicio INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_tipo_servicio,
    nombre_servicio,
    descripcion,
    requiere_costo_administrativo,
    costo_administrativo,
    dias_respuesta,
    estado_servicio
  FROM tipo_servicio
  WHERE id_tipo_servicio = @id_tipo_servicio;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_servicio_obtener_por_nombre]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_servicio_obtener_por_nombre]
  @nombre_servicio NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1
    id_tipo_servicio,
    nombre_servicio,
    descripcion,
    requiere_costo_administrativo,
    costo_administrativo,
    dias_respuesta,
    estado_servicio
  FROM tipo_servicio
  WHERE nombre_servicio = @nombre_servicio;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_tramite_crear]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_tramite_crear]
  @id_tipo_servicio INT,
  @nombre_tramite VARCHAR(100),
  @descripcion VARCHAR(500) = NULL,
  @requiere_costo BIT = 0,
  @costo_tramite DECIMAL(10, 2) = 0,
  @campos_obligatorios NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO tipo_tramite (
    id_tipo_servicio,
    nombre_tramite,
    descripcion,
    requiere_costo,
    costo_tramite,
    campos_obligatorios
  ) VALUES (
    @id_tipo_servicio,
    @nombre_tramite,
    @descripcion,
    @requiere_costo,
    @costo_tramite,
    @campos_obligatorios
  );

  DECLARE @id_tipo_tramite INT = CAST(SCOPE_IDENTITY() AS INT);
  EXEC dbo.sp_tipo_tramite_obtener_por_id @id_tipo_tramite = @id_tipo_tramite;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_tramite_listar_por_servicio]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_tramite_listar_por_servicio]
  @id_tipo_servicio INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id_tipo_tramite,
    id_tipo_servicio,
    nombre_tramite,
    descripcion,
    requiere_costo,
    costo_tramite,
    campos_obligatorios
  FROM tipo_tramite
  WHERE (@id_tipo_servicio IS NULL OR id_tipo_servicio = @id_tipo_servicio)
  ORDER BY nombre_tramite ASC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_tramite_obtener_por_id]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_tramite_obtener_por_id]
  @id_tipo_tramite INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1
    id_tipo_tramite,
    id_tipo_servicio,
    nombre_tramite,
    descripcion,
    requiere_costo,
    costo_tramite,
    campos_obligatorios
  FROM tipo_tramite
  WHERE id_tipo_tramite = @id_tipo_tramite;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_tipo_tramite_obtener_por_nombre]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_tipo_tramite_obtener_por_nombre]
  @nombre_tramite VARCHAR(100),
  @id_tipo_servicio INT = NULL
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP 1
    id_tipo_tramite,
    id_tipo_servicio,
    nombre_tramite,
    descripcion,
    requiere_costo,
    costo_tramite,
    campos_obligatorios
  FROM tipo_tramite
  WHERE LOWER(nombre_tramite) = LOWER(@nombre_tramite)
    AND (@id_tipo_servicio IS NULL OR id_tipo_servicio = @id_tipo_servicio)
  ORDER BY id_tipo_tramite ASC;
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_upsert_admin_empleado]    Script Date: 1/6/2026 4:56:50 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_upsert_admin_empleado]
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
