import sql from 'mssql';
import PDFDocument from 'pdfkit';
import { db } from '../database/db.js';
import { ApiError } from '../utils/apiError.js';
import { SolicitudRepository } from '../repositories/solicitud.repository.js';

const CERT_COLOR_PALETTE = {
  background: '#04060D',
  panel: '#0F182A',
  section: '#17253D',
  border: '#33D0BC',
  text: '#F8FAFC',
  label: '#9AAEC8',
  accent: '#5EEAD4'
};

const SERVICIO_CLASE_METADATA = Object.freeze({
  1: {
    clase: 'A',
    titulo: 'Certificado Clase A - Profesional',
    descripcion: 'Certificado de inscripción de sustancias controladas'
  },
  2: {
    clase: 'B',
    titulo: 'Certificado Clase B - Establecimiento Privado',
    descripcion: 'Certificado de inscripción de sustancias controladas'
  },
  3: {
    clase: 'B',
    titulo: 'Certificado Clase B - Institución Pública',
    descripcion: 'Certificado de inscripción de sustancias controladas'
  }
});

const sanitizeString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const toUpperSafe = (value) => sanitizeString(value).toUpperCase();

const formatDateEs = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-DO');
};

const deriveClaseMetadata = (solicitud, certificado) => {
  const servicioId = Number(solicitud?.id_tipo_servicio);
  const tipoCertificado = sanitizeString(certificado?.tipo_certificado).toUpperCase();
  const servicioMeta = SERVICIO_CLASE_METADATA[servicioId] || null;
  let clase = servicioMeta?.clase || (tipoCertificado.includes('CLASE_B') ? 'B' : 'A');
  if (tipoCertificado.includes('CLASE_A')) {
    clase = 'A';
  }
  const titulo =
    servicioMeta?.titulo ||
    sanitizeString(solicitud?.nombre_tipo_servicio) ||
    `Certificado Clase ${clase}`;

  return {
    clase,
    titulo,
    descripcion: servicioMeta?.descripcion || 'Certificado de inscripción de sustancias controladas'
  };
};

const fetchDatoServicio = (source, keys, fallback = '') => {
  if (!source) return fallback;
  const keyList = Array.isArray(keys) ? keys : [keys];
  for (const key of keyList) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }
    const value = source[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    return value;
  }
  return fallback;
};

const inferBooleanFlag = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ['si', 'sí', 'true', '1', 'x'].includes(normalized);
  }
  return false;
};

const normalizeCategoriasList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([, val]) => inferBooleanFlag(val))
      .map(([key]) => key);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const parseCategoriasFlags = (raw) => {
  const set = new Set();
  for (const item of normalizeCategoriasList(raw)) {
    const normalized = toUpperSafe(item);
    const match = normalized.match(/(IV|III|II|I)/);
    if (match) {
      set.add(match[1]);
    }
  }
  return {
    I: set.has('I'),
    II: set.has('II'),
    III: set.has('III'),
    IV: set.has('IV')
  };
};

const buildCertificadoPayload = (solicitud, certificado) => {
  const datosServicio = solicitud?.datos_servicio || {};
  const getDato = (keys, fallback = '') => fetchDatoServicio(datosServicio, keys, fallback);
  const claseMetadata = deriveClaseMetadata(solicitud, certificado);
  const categorias = parseCategoriasFlags(
    getDato(['categorias_autorizadas', 'categorias_droga', 'categorias_permitidas', 'clases_autorizadas', 'categorias'])
  );

  const normalizeListValue = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => toUpperSafe(item)).filter(Boolean).join(', ');
    }
    return toUpperSafe(value);
  };

  let categoriaTexto = (() => {
    const activos = Object.entries(categorias)
      .filter(([, val]) => Boolean(val))
      .map(([key]) => key);
    return activos.length ? activos.join(', ') : '';
  })();

  if (!categoriaTexto) {
    categoriaTexto = toUpperSafe(getDato(['categoria', 'categoria_establecimiento', 'categoria_permiso']));
  }

  const actividadRaw = getDato(
    ['actividades_establecimiento', 'actividad_principal', 'actividad', 'giro_negocio', 'profesion_otro', 'profesion'],
    solicitud?.profesion_solicitante
  );
  const actividadPrincipal = normalizeListValue(actividadRaw) || claseMetadata.titulo;

  const nombreCertificado = toUpperSafe(
    getDato([
      'nombre_profesional',
      'nombre_empresa',
      'nombre_institucion',
      'nombre_establecimiento',
      'nombre_representante',
      'razon_social'
    ], solicitud?.nombre_solicitante)
  );

  const direccionPrincipal = toUpperSafe(
    getDato([
      'direccion_postal',
      'direccion_establecimiento',
      'direccion_institucion',
      'direccion_trabajo',
      'direccion_correspondencia',
      'direccion'
    ], solicitud?.direccion_contacto)
  );

  const ciudad = toUpperSafe(
    getDato(['ciudad', 'municipio', 'provincia', 'localidad', 'ciudad_establecimiento', 'ciudad_institucion']) ||
    solicitud?.ciudad ||
    ''
  );

  return {
    clase: claseMetadata.clase,
    tituloCertificado: claseMetadata.titulo,
    certificadoDescripcion: claseMetadata.descripcion,
    numeroCIDC: toUpperSafe(certificado?.numero_certificado || solicitud?.numero_cidc_anterior || ''),
    numeroExpediente: toUpperSafe(solicitud?.numero_expediente || ''),
    fechaEmision: certificado?.fecha_emision || solicitud?.fecha_actualizacion || solicitud?.fecha_creacion || '',
    fechaExpiracion: certificado?.fecha_vencimiento || solicitud?.fecha_vencimiento || '',
    nombreCertificado,
    direccionPrincipal,
    direccionAlterna: toUpperSafe(getDato(['direccion_trabajo', 'direccion_establecimiento', 'direccion_institucion'])),
    ciudad,
    actividadPrincipal,
    categoriaTexto: categoriaTexto || 'NO ESPECIFICADA',
    numeroCidcAnterior: toUpperSafe(solicitud?.numero_cidc_anterior || ''),
    motivoDetalle: toUpperSafe(solicitud?.motivo_detalle || '')
  };
};

const renderCertificadoPorClase = (doc, data) => {
  const margin = 48;
  const innerWidth = doc.page.width - margin * 2;
  let cursorY = margin;
  const claseLabel = (data.clase || 'A').toUpperCase();
  const heading = data.tituloCertificado || `CERTIFICADO CLASE ${claseLabel}`;
  const subheading = data.certificadoDescripcion || 'Certificado de inscripción de sustancias controladas';
  const panelFill = claseLabel === 'B' ? '#122135' : '#1F1A2E';

  const displayValue = (value, { uppercase = true } = {}) => {
    const normalized = sanitizeString(value);
    if (!normalized) return 'NO ESPECIFICADO';
    return uppercase ? normalized.toUpperCase() : normalized;
  };

  const displayDate = (value) => {
    const formatted = formatDateEs(value);
    return formatted || 'NO ESPECIFICADA';
  };

  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(CERT_COLOR_PALETTE.background);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(24).fillColor(CERT_COLOR_PALETTE.text)
    .text(heading.toUpperCase(), margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 32;
  doc.font('Helvetica').fontSize(12).fillColor(CERT_COLOR_PALETTE.label)
    .text(subheading, margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 20;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(CERT_COLOR_PALETTE.accent)
    .text(`CLASE ${claseLabel}`, margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 26;

  doc.font('Helvetica').fontSize(10).fillColor(CERT_COLOR_PALETTE.label)
    .text(`Fecha de emisión: ${displayDate(data.fechaEmision)}`, margin, cursorY, { width: innerWidth, align: 'right' });
  cursorY += 16;

  const drawField = (label, value, options = {}) => {
    const height = options.height ?? 46;
    doc.save();
    doc.rect(margin, cursorY, innerWidth, height)
      .fillColor(panelFill)
      .fill();
    doc.rect(margin, cursorY, innerWidth, height)
      .lineWidth(0.8)
      .strokeColor(CERT_COLOR_PALETTE.border)
      .stroke();
    doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.label)
      .text(label.toUpperCase(), margin + 14, cursorY + 8, { width: innerWidth - 28 });
    doc.font('Helvetica').fontSize(13).fillColor(CERT_COLOR_PALETTE.text)
      .text(value, margin + 14, cursorY + 24, { width: innerWidth - 28 });
    doc.restore();
    cursorY += height + 12;
  };

  const infoFields = [
    { label: 'Nombre', value: displayValue(data.nombreCertificado) },
    { label: 'Dirección', value: displayValue(data.direccionPrincipal || data.direccionAlterna) },
    { label: 'Ciudad', value: displayValue(data.ciudad) },
    { label: 'Fecha de expiración', value: displayDate(data.fechaExpiracion) },
    { label: 'Actividad', value: displayValue(data.actividadPrincipal) },
    { label: 'Categoría', value: displayValue(data.categoriaTexto) },
    {
      label: 'Número de CIDC',
      value: displayValue(data.numeroCIDC || data.numeroExpediente || data.numeroCidcAnterior)
    }
  ];

  infoFields.forEach((field) => drawField(field.label, field.value));

  cursorY += 24;
  const signatureLineStart = margin + innerWidth * 0.2;
  const signatureLineEnd = margin + innerWidth * 0.8;
  doc.moveTo(signatureLineStart, cursorY)
    .lineTo(signatureLineEnd, cursorY)
    .lineWidth(1)
    .strokeColor(CERT_COLOR_PALETTE.border)
    .stroke();
  cursorY += 10;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.text)
    .text('DIRECCIÓN NACIONAL DE CONTROL DE DROGAS', margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 16;
  doc.font('Helvetica').fontSize(9).fillColor(CERT_COLOR_PALETTE.label)
    .text('Firma autorizada DNCD', margin, cursorY, { width: innerWidth, align: 'center' });
};

//Controlador de Certificados
export class CertificadosController {

   // Generar certificado para solicitud

  static async generarCertificado(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const { numero_certificado, tipo_certificado = 'CIDC_CLASE_A', fecha_vencimiento } = req.body;

      if (!id_solicitud) {
        throw new ApiError('id_solicitud es requerido', 400);
      }
      const solicitudId = Number.parseInt(id_solicitud, 10);
      if (Number.isNaN(solicitudId)) {
        throw new ApiError('id_solicitud inválido', 400);
      }

      const fechaVencimientoDate = fecha_vencimiento ? new Date(fecha_vencimiento) : null;
      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, solicitudId)
        .input('numero_certificado', sql.VarChar(50), numero_certificado || null)
        .input('tipo_certificado', sql.VarChar(50), tipo_certificado)
        .input('fecha_vencimiento', sql.Date, fechaVencimientoDate)
        .execute('sp_certificado_generar');

      const data = result.recordset?.[0];
      if (!data) {
        throw new ApiError('No se pudo generar el certificado', 500);
      }

      res.status(201).json({
        success: true,
        message: 'Certificado generado exitosamente',
        data
      });
    } catch (error) {
      next(error);
    }
  }

   //Obtener certificado por ID

  static async obtenerCertificado(req, res, next) {
    try {
      const { id } = req.params;
      const certificadoId = Number.parseInt(id, 10);
      if (Number.isNaN(certificadoId)) {
        throw new ApiError('Identificador de certificado inválido', 400);
      }

      const result = await db.pool.request()
        .input('id_certificado', sql.Int, certificadoId)
        .execute('sp_certificado_obtener');

      const data = result.recordset?.[0];
      if (!data) {
        throw new ApiError('Certificado no encontrado', 404);
      }

      if (req.user?.tipo_usuario === 'SOLICITANTE') {
        const solicitanteId = Number.parseInt(req.user.id_solicitante, 10);
        const solicitudId = data.id_solicitud ? Number.parseInt(data.id_solicitud, 10) : NaN;
        if (Number.isNaN(solicitudId)) {
          throw new ApiError('No se pudo validar la solicitud asociada al certificado', 500);
        }

        const solicitud = await SolicitudRepository.obtenerPorId(solicitudId);
        if (!solicitud || Number.parseInt(solicitud.id_solicitante, 10) !== solicitanteId) {
          throw new ApiError('No tienes permiso para consultar este certificado', 403);
        }
      }

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

   // Obtener certificado por solicitud
  static async obtenerPorSolicitud(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const solicitudId = Number.parseInt(id_solicitud, 10);
      if (Number.isNaN(solicitudId)) {
        throw new ApiError('id_solicitud inválido', 400);
      }

      const solicitud = await SolicitudRepository.obtenerPorId(solicitudId);
      if (!solicitud) {
        throw new ApiError('Solicitud no encontrada', 404);
      }

      if (req.user?.tipo_usuario === 'SOLICITANTE') {
        const solicitanteId = Number.parseInt(req.user.id_solicitante, 10);
        if (Number.parseInt(solicitud.id_solicitante, 10) !== solicitanteId) {
          throw new ApiError('No tienes permiso para consultar esta solicitud', 403);
        }
      }

      const result = await db.pool.request()
        .input('id_solicitud', sql.Int, solicitudId)
        .execute('sp_certificado_obtener_por_solicitud');

      res.status(200).json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

   // Listar certificados
  static async listar(req, res, next) {
    try {
      const { estado, fechaDesde, fechaHasta } = req.query;
      const estadoFiltro = estado?.trim() || null;
      const parseDate = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const desdeDate = parseDate(fechaDesde);
      const hastaDate = parseDate(fechaHasta);

      const request = db.pool.request();
      if (estadoFiltro) {
        request.input('estado', sql.VarChar(20), estadoFiltro);
      }
      if (desdeDate) {
        request.input('fechaDesde', sql.DateTime, desdeDate);
      }
      if (hastaDate) {
        request.input('fechaHasta', sql.DateTime, hastaDate);
      }

      const result = await request.execute('sp_certificado_listar');

      res.status(200).json({
        success: true,
        total: result.recordset.length,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  
   // Actualizar estado de certificado
   
  static async actualizarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { estado_certificado } = req.body;

      const estadosValidos = ['ACTIVO', 'VENCIDO', 'REVOCADO', 'CANCELADO'];

      if (!estado_certificado || !estadosValidos.includes(estado_certificado)) {
        throw new ApiError('Estado de certificado inválido', 400);
      }
      const certificadoId = Number.parseInt(id, 10);
      if (Number.isNaN(certificadoId)) {
        throw new ApiError('Identificador de certificado inválido', 400);
      }

      const result = await db.pool.request()
        .input('id_certificado', sql.Int, certificadoId)
        .input('estado_certificado', sql.VarChar(20), estado_certificado)
        .execute('sp_certificado_actualizar_estado');

      const data = result.recordset?.[0];
      if (!data) {
        throw new ApiError('No se pudo actualizar el certificado', 500);
      }

      res.status(200).json({
        success: true,
        message: 'Estado del certificado actualizado exitosamente',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  
   // Descargar certificado (PDF)
  
  static async descargarCertificado(req, res, next) {
    try {
      const { id } = req.params;
      const certificadoId = Number.parseInt(id, 10);
      if (Number.isNaN(certificadoId)) {
        throw new ApiError('Identificador de certificado inválido', 400);
      }

      const resultado = await db.pool.request()
        .input('id_certificado', sql.Int, certificadoId)
        .execute('sp_certificado_descargar_info');

      const certificado = resultado.recordset?.[0];
      if (!certificado) {
        throw new ApiError('Certificado no encontrado', 404);
      }

      const solicitud = await SolicitudRepository.obtenerPorId(certificado.id_solicitud);
      if (!solicitud) {
        throw new ApiError('Solicitud asociada al certificado no encontrada', 404);
      }

      if (req.user?.tipo_usuario === 'SOLICITANTE') {
        const solicitanteId = Number.parseInt(req.user.id_solicitante, 10);
        if (Number.parseInt(solicitud.id_solicitante, 10) !== solicitanteId) {
          throw new ApiError('No tienes permiso para descargar este certificado', 403);
        }
      }

      const payload = buildCertificadoPayload(solicitud, certificado);
      const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
      const chunks = [];
      let streamFailed = false;

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (error) => {
        streamFailed = true;
        console.error('Error generando el PDF del certificado:', error);
        next(new ApiError('No se pudo generar el certificado en PDF', 500));
      });
      doc.on('end', () => {
        if (streamFailed) {
          return;
        }
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=certificado-${payload.numeroCIDC || certificado.id_certificado}.pdf`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).send(pdfBuffer);
      });

      renderCertificadoPorClase(doc, payload);
      doc.end();
    } catch (error) {
      next(error);
    }
  }

   // Descargar certificado partiendo del id de solicitud

  static async descargarPorSolicitud(req, res, next) {
    try {
      const { id_solicitud } = req.params;
      const solicitudId = Number.parseInt(id_solicitud, 10);
      if (Number.isNaN(solicitudId)) {
        throw new ApiError('id_solicitud inválido', 400);
      }

      const solicitud = await SolicitudRepository.obtenerPorId(solicitudId);
      if (!solicitud) {
        throw new ApiError('Solicitud no encontrada', 404);
      }

      if (req.user?.tipo_usuario === 'SOLICITANTE') {
        const solicitanteId = Number.parseInt(req.user.id_solicitante, 10);
        if (Number.isNaN(solicitanteId) || Number.parseInt(solicitud.id_solicitante, 10) !== solicitanteId) {
          throw new ApiError('No tienes permiso para descargar este certificado', 403);
        }
      }

      const resultado = await db.pool.request()
        .input('id_solicitud', sql.Int, solicitudId)
        .execute('sp_certificado_obtener_por_solicitud');

      const certificado = resultado.recordset?.[0] || null;

      const payload = buildCertificadoPayload(solicitud, certificado || {
        numero_certificado: solicitud.numero_expediente || `SOL-${solicitudId}`,
        tipo_certificado: 'CIDC_CLASE_A',
        fecha_emision: solicitud.fecha_actualizacion || solicitud.fecha_creacion || new Date()
      });

      const doc = new PDFDocument({ size: 'LETTER', margin: 36 });
      const chunks = [];
      let streamFailed = false;

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (error) => {
        streamFailed = true;
        console.error('Error generando el PDF del certificado:', error);
        next(new ApiError('No se pudo generar el certificado en PDF', 500));
      });
      doc.on('end', () => {
        if (streamFailed) {
          return;
        }
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=certificado-${payload.numeroCIDC || solicitud.numero_expediente || solicitudId}.pdf`
        );
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).send(pdfBuffer);
      });

      renderCertificadoPorClase(doc, payload);
      doc.end();
    } catch (error) {
      next(error);
    }
  }

  
  //Obtener estadísticas de certificados
   
  static async obtenerEstadisticas(req, res, next) {
    try {
      const result = await db.pool.request()
        .execute('sp_certificado_estadisticas');

      res.status(200).json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CertificadosController;
