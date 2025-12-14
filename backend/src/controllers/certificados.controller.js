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

const chunkArray = (values, size) => {
  const result = [];
  for (let i = 0; i < values.length; i += size) {
    result.push(values.slice(i, i + size));
  }
  return result;
};

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

const formatCurrencyDOP = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const number = Number(value);
  if (Number.isNaN(number)) return '';
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(number);
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

const buildProfesionChecks = (profesionRaw) => {
  const normalized = toUpperSafe(profesionRaw);
  const checks = {
    veterinaria: normalized.includes('VETERIN'),
    odontologia: normalized.includes('ODONTO')
  };
  checks.medicina = normalized.includes('MEDIC') && !checks.veterinaria;
  checks.otra = Boolean(normalized && !checks.medicina && !checks.veterinaria && !checks.odontologia);
  checks.descripcion = normalized;
  return checks;
};

const buildCertificadoPayload = (solicitud, certificado) => {
  const datosServicio = solicitud?.datos_servicio || {};
  const getDato = (keys, fallback = '') => fetchDatoServicio(datosServicio, keys, fallback);
  const profesionChecks = buildProfesionChecks(
    solicitud?.profesion_solicitante || getDato(['profesion', 'ocupacion', 'especialidad'])
  );
  const categorias = parseCategoriasFlags(
    getDato(['categorias_autorizadas', 'categorias_droga', 'categorias_permitidas', 'clases_autorizadas', 'categorias'])
  );
  const sumaPagar = solicitud?.monto_total_reportado ?? getDato(['suma_pagar', 'monto_pagar']);
  const statusOtraDetalle = toUpperSafe(
    getDato(['estatus_otro_detalle', 'estatus_explicacion', 'estatus_otra'], solicitud?.motivo_detalle || '')
  );

  const estatusFlags = {
    primera: !solicitud?.numero_cidc_anterior,
    renovacion: Boolean(solicitud?.numero_cidc_anterior),
    anteriorNegada: inferBooleanFlag(getDato(['solicitud_anterior_negada', 'estatus_negada'])),
    cidcReprobado: inferBooleanFlag(getDato(['cidc_reprobado', 'estatus_cidc_reprobado', 'reprobado_cidc'])),
    otra: Boolean(statusOtraDetalle),
    otraDetalle: statusOtraDetalle
  };

  return {
    numeroCIDC: toUpperSafe(certificado?.numero_certificado || solicitud?.numero_cidc_anterior || ''),
    numeroExpediente: toUpperSafe(solicitud?.numero_expediente || ''),
    tipoCertificado: certificado?.tipo_certificado || '',
    fechaEmision: certificado?.fecha_emision || '',
    nombreProfesional: toUpperSafe(solicitud?.nombre_solicitante || getDato(['nombre_profesional'])),
    direccionPostal: toUpperSafe(getDato(['direccion_postal', 'direccion_residencial', 'direccion_correspondencia', 'direccion'])),
    cedula: toUpperSafe(solicitud?.identificador_solicitante || getDato(['cedula_profesional'])),
    exequatur: toUpperSafe(getDato(['numero_exequatur', 'exequatur'])),
    colegiatura: toUpperSafe(getDato(['numero_colegiatura', 'colegiatura'])),
    telefonoResidencial: sanitizeString(getDato(['telefono_residencial', 'telefono_fijo'])) || sanitizeString(solicitud?.telefono_contacto),
    celular: sanitizeString(getDato(['telefono_celular', 'celular'])) || sanitizeString(solicitud?.telefono_contacto),
    lugarTrabajo: toUpperSafe(getDato(['lugar_trabajo', 'institucion', 'empresa', 'establecimiento'])),
    email: toUpperSafe(solicitud?.email_solicitante || getDato(['correo_contacto', 'email_profesional'])),
    direccionTrabajo: toUpperSafe(getDato(['direccion_trabajo', 'direccion_consultorio', 'direccion_establecimiento', 'direccion_labora'])),
    telefonoTrabajo: sanitizeString(getDato(['telefono_trabajo', 'telefono_empresa', 'telefono_oficina'])),
    profesionChecks,
    profesionDescripcion: profesionChecks.descripcion,
    categorias,
    estatus: estatusFlags,
    numeroCidcAnterior: toUpperSafe(solicitud?.numero_cidc_anterior || ''),
    sumaPagar,
    fechaSolicitud: solicitud?.fecha_creacion || certificado?.fecha_emision || '',
    fechaAprobado: certificado?.fecha_emision || '',
    noFactura: toUpperSafe(getDato(['numero_factura', 'factura']) || solicitud?.resumen_pago_label),
    fechaPago: getDato(['fecha_pago', 'pago_fecha']),
    motivoDetalle: toUpperSafe(solicitud?.motivo_detalle || '')
  };
};

const renderCertificadoClaseA = (doc, data) => {
  const margin = 36;
  const innerWidth = doc.page.width - margin * 2;
  let cursorY = margin;

  const displayValue = (value) => {
    const normalized = sanitizeString(value);
    return normalized || '________________';
  };

  const drawFieldBlock = (label, value, x, y, width, height = 26) => {
    doc.save();
    doc.rect(x, y, width, height).fill(CERT_COLOR_PALETTE.panel);
    doc.rect(x, y, width, height)
      .lineWidth(0.8)
      .strokeColor(CERT_COLOR_PALETTE.border)
      .stroke();

    doc.font('Helvetica').fontSize(8).fillColor(CERT_COLOR_PALETTE.label)
      .text(label, x + 6, y + 4, { width: width - 12, height: 10 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.text)
      .text(displayValue(value), x + 6, y + 14, { width: width - 12, height: height - 18 });
    doc.restore();
  };

  const drawFieldRow = (columns, options = {}) => {
    const height = options.height ?? 28;
    const gap = options.gap ?? 8;
    const startX = options.startX ?? margin;
    const totalWidth = options.totalWidth ?? innerWidth;
    const rowY = options.y ?? cursorY;
    const totalSpan = columns.reduce((sum, column) => sum + (column.span || 1), 0);
    let currentX = startX;

    columns.forEach((column, idx) => {
      const width = ((totalWidth - gap * (columns.length - 1)) * (column.span || 1)) / totalSpan;
      drawFieldBlock(column.label, column.value, currentX, rowY, width, height);
      currentX += width + gap;
    });

    cursorY = Math.max(cursorY, rowY + height + (options.afterGap ?? 6));
  };

  const drawSectionHeader = (label) => {
    doc.save();
    doc.rect(margin, cursorY, innerWidth, 22)
      .fillAndStroke(CERT_COLOR_PALETTE.section, CERT_COLOR_PALETTE.border);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(CERT_COLOR_PALETTE.text)
      .text(label, margin + 10, cursorY + 6, { width: innerWidth - 20 });
    doc.restore();
    cursorY += 28;
  };

  const drawCheckboxItem = (x, y, width, label, checked) => {
    const boxSize = 12;
    doc.save();
    doc.lineWidth(1);
    doc.strokeColor(checked ? CERT_COLOR_PALETTE.accent : CERT_COLOR_PALETTE.border)
      .rect(x, y, boxSize, boxSize)
      .stroke();
    if (checked) {
      doc.moveTo(x + 2, y + boxSize / 2)
        .lineTo(x + boxSize / 2 - 1, y + boxSize - 2)
        .lineTo(x + boxSize - 2, y + 2)
        .stroke();
    }
    doc.font('Helvetica').fontSize(10).fillColor(CERT_COLOR_PALETTE.text)
      .text(label, x + boxSize + 6, y - 2, { width: width - boxSize - 6 });
    doc.restore();
  };

  const drawCheckboxRow = (items, options = {}) => {
    const startX = options.startX ?? margin;
    const totalWidth = options.totalWidth ?? innerWidth;
    const gap = options.gap ?? 20;
    const rowY = options.y ?? cursorY;
    const widthPerItem = items.length > 0
      ? (totalWidth - gap * (items.length - 1)) / items.length
      : totalWidth;
    items.forEach((item, index) => {
      const label = item.detail ? `${item.label}: ${displayValue(item.detail)}` : item.label;
      drawCheckboxItem(startX + index * (widthPerItem + gap), rowY, widthPerItem, label, Boolean(item.checked));
    });
    cursorY = Math.max(cursorY, rowY + (options.height ?? 20) + (options.afterGap ?? 6));
  };

  const drawNoteBlock = () => {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.text)
      .text('Nota:', margin, cursorY);
    cursorY += 14;
    doc.font('Helvetica').fontSize(10).fillColor(CERT_COLOR_PALETTE.text)
      .text('Este permiso no es válido si:', margin, cursorY);
    cursorY += 14;
    const notaTexto = [
      'a) No está debidamente firmado y sellado por los funcionarios autorizados por MSP y DNCD.',
      'b) Los renglones que lo conforman no están completos.',
      'c) Si se determina que los datos suministrados para su autorización no corresponden con la verdad.',
      'd) Tiene tachaduras o borraduras en su contenido.'
    ].join('\n');
    doc.text(notaTexto, margin + 16, cursorY, { width: innerWidth - 16, lineGap: 2 });
    cursorY = doc.y + 12;
    doc.font('Helvetica-Bold').fontSize(11).text('Advertencia:', margin, cursorY);
    cursorY += 14;
    doc.font('Helvetica').fontSize(10)
      .text('El código Penal de la República Dominicana sanciona la falsificación, alteración o falsedad de escritura técnica o pública.', margin, cursorY, { width: innerWidth });
    cursorY = doc.y + 20;
  };

  doc.save();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(CERT_COLOR_PALETTE.background);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(22).fillColor(CERT_COLOR_PALETTE.text)
    .text('SOLICITUD', margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 24;
  doc.fontSize(12)
    .text('CERTIFICADO DE INSCRIPCIÓN DE SUSTANCIAS CONTROLADAS', margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 14;
  doc.text('- CLASE A -', margin, cursorY, { width: innerWidth, align: 'center' });
  cursorY += 24;

  doc.font('Helvetica').fontSize(10)
    .text(`No. CIDC: ${displayValue(data.numeroCIDC)}`, margin, cursorY, { width: innerWidth, align: 'right' });
  cursorY += 12;
  doc.text(`Expediente: ${displayValue(data.numeroExpediente)}`, margin, cursorY, { width: innerWidth, align: 'right' });
  cursorY += 18;

  drawSectionHeader('IDENTIFICACIÓN');
  drawFieldRow([
    { label: '1) Nombre del Profesional', value: data.nombreProfesional }
  ], { height: 34 });
  drawFieldRow([
    { label: '2) Dirección / Correo Postal (P.O.B)', value: data.direccionPostal }
  ], { height: 34 });
  drawFieldRow([
    { label: '3) Cédula de Identidad y Electoral', value: data.cedula },
    { label: '4) Exequátur', value: data.exequatur },
    { label: '5) No. Colegiatura', value: data.colegiatura }
  ]);
  drawFieldRow([
    { label: '6) Teléfono(s) Residencial', value: data.telefonoResidencial },
    { label: '7) Celular', value: data.celular }
  ]);
  drawFieldRow([
    { label: '8) Lugar de Trabajo', value: data.lugarTrabajo },
    { label: '9) E-mail', value: data.email }
  ], { height: 30 });
  drawFieldRow([
    { label: '10) Dirección del Lugar de Trabajo', value: data.direccionTrabajo, span: 2 },
    { label: '11) Teléfono(s)', value: data.telefonoTrabajo, span: 1 }
  ], { height: 34, gap: 10 });

  cursorY += 6;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.text)
    .text('12) PROFESIÓN', margin, cursorY);
  cursorY += 14;
  const profesionItems = [
    { label: 'a) Medicina', checked: data.profesionChecks.medicina },
    { label: 'b) Medicina Veterinaria', checked: data.profesionChecks.veterinaria },
    { label: 'c) Odontología', checked: data.profesionChecks.odontologia },
    {
      label: 'd) Otra, especifique',
      checked: data.profesionChecks.otra,
      detail: data.profesionChecks.otra ? data.profesionDescripcion : ''
    }
  ];
  chunkArray(profesionItems, 2).forEach((row) => {
    drawCheckboxRow(row, { gap: 30, height: 20 });
  });

  doc.font('Helvetica-Bold').fontSize(11).text('13) ESTATUS', margin, cursorY);
  cursorY += 14;
  const estatusItems = [
    { label: 'a) Primera Solicitud', checked: data.estatus.primera },
    { label: 'b) Renovación', checked: data.estatus.renovacion },
    { label: 'c) Solicitud anterior negada', checked: data.estatus.anteriorNegada },
    { label: 'd) CIDC reprobado, suspendido', checked: data.estatus.cidcReprobado },
    {
      label: 'e) Otra, especifique',
      checked: data.estatus.otra,
      detail: data.estatus.otra ? data.estatus.otraDetalle : ''
    }
  ];
  chunkArray(estatusItems, 2).forEach((row) => {
    drawCheckboxRow(row, { gap: 24, height: 20 });
  });

  doc.font('Helvetica-Bold').fontSize(10).text('Categorías de Drogas Controladas que tendrá derecho a prescribir o administrar:', margin, cursorY);
  cursorY += 12;
  const categoriaItems = [
    { label: 'I', checked: data.categorias.I },
    { label: 'II', checked: data.categorias.II },
    { label: 'III', checked: data.categorias.III },
    { label: 'IV', checked: data.categorias.IV }
  ];
  drawCheckboxRow(categoriaItems, { gap: 36, height: 20 });

  drawFieldRow([
    { label: 'Si su respuesta fue b o d, No. CIDC', value: data.numeroCidcAnterior || data.numeroCIDC },
    { label: 'Si su respuesta fue c, d o e explique el motivo en el reverso (Renglón No. 13)', value: data.motivoDetalle }
  ], { height: 36 });

  drawFieldRow([
    { label: '14) SUMA A PAGAR: RD$', value: formatCurrencyDOP(data.sumaPagar) || '' },
    { label: 'Fecha solicitud', value: formatDateEs(data.fechaSolicitud) },
    { label: 'Firma Interesado', value: '' }
  ], { height: 32 });

  const internalTop = cursorY;
  const leftWidth = innerWidth * 0.32;
  const internalHeight = 32;
  doc.save();
  doc.rect(margin, internalTop, leftWidth, internalHeight)
    .fill(CERT_COLOR_PALETTE.section);
  doc.rect(margin, internalTop, leftWidth, internalHeight)
    .strokeColor(CERT_COLOR_PALETTE.border)
    .stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(CERT_COLOR_PALETTE.text)
    .text('SÓLO PARA USO INTERNO', margin + 10, internalTop + 10, { width: leftWidth - 16 });
  doc.restore();

  drawFieldRow([
    { label: 'Fecha aprobado', value: formatDateEs(data.fechaAprobado) },
    { label: 'No. Factura', value: data.noFactura },
    { label: 'Fecha pago', value: formatDateEs(data.fechaPago) }
  ], {
    height: internalHeight,
    startX: margin + leftWidth + 10,
    totalWidth: innerWidth - leftWidth - 10,
    y: internalTop,
    afterGap: 10
  });

  drawNoteBlock();
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

      renderCertificadoClaseA(doc, payload);
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

      renderCertificadoClaseA(doc, payload);
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
