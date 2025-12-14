import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheckCircle, FiAlertTriangle, FiDownload, FiChevronRight } from 'react-icons/fi'
import { solicitudAPI, archivoAPI } from '../../services/api'
import SERVICIO_FORM_CONFIG from '../../config/serviciosFormConfig'
import {
  TIPOS_SERVICIO_MAP,
  TIPOS_TRAMITE_MAP
} from '../../constants/solicitudOptions'
import { buildCamposResumen } from '../../utils/solicitudHelpers'
import { useAuthStore } from '../../store/authStore'
import jsPDF from 'jspdf'

/* eslint-disable complexity */

const PDF_MAX_CURSOR = 760
const PDF_RESET_CURSOR = 40

const PDF_COLOR_PALETTE = {
  background: '#04060d',
  panel: '#0f182a',
  section: '#17253d',
  border: '#33d0bc',
  text: '#f8fafc',
  label: '#94a3b8',
  accent: '#5eead4'
}

const parseHexColor = (hex) => {
  if (!hex) {
    return { r: 0, g: 0, b: 0 }
  }
  const normalized = hex.replace('#', '')
  const expand = normalized.length === 3
    ? normalized.split('').map((digit) => digit + digit).join('')
    : normalized.padEnd(6, '0').slice(0, 6)
  const bigint = Number.parseInt(expand, 16)
  if (Number.isNaN(bigint)) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  }
}

const setFillColorHex = (doc, hex) => {
  const { r, g, b } = parseHexColor(hex)
  doc.setFillColor(r, g, b)
}

const setStrokeColorHex = (doc, hex) => {
  const { r, g, b } = parseHexColor(hex)
  doc.setDrawColor(r, g, b)
}

const drawAlignedText = (doc, text, x, y, align = 'left', options = {}) => {
  const opts = { ...(options || {}), align }
  doc.text(text, x, y, opts)
}

const agregarLineasPdf = (doc, lines, cursorInicial, x = 40, step = 18) => {
  let cursorY = cursorInicial
  for (const line of lines) {
    doc.text(line, x, cursorY)
    cursorY += step
  }
  return cursorY
}

const agregarListadoPdf = (doc, items, cursorInicial, formatter, x = 50) => {
  let cursorY = cursorInicial
  for (const item of items) {
    doc.text(formatter(item), x, cursorY)
    cursorY += 14
    if (cursorY > PDF_MAX_CURSOR) {
      doc.addPage()
      cursorY = PDF_RESET_CURSOR
    }
  }
  return cursorY
}

const buildPdfPreviewContent = ({ pdfLoading, pdfPreviewUrl, solicitud }) => {
  if (!solicitud) {
    return <p className="text-sm text-gray-600">Carga la solicitud para ver el PDF.</p>
  }

  if (pdfLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-950"></div>
      </div>
    )
  }

  if (pdfPreviewUrl) {
    return (
      <>
        <iframe
          title="Vista previa PDF"
          src={pdfPreviewUrl}
          className="w-full h-96 border rounded"
        ></iframe>
        <div className="flex gap-3 flex-wrap">
          <a
            href={pdfPreviewUrl}
            download={`solicitud-${solicitud.id_solicitud}.pdf`}
            className="btn-primary"
          >
            Descargar PDF
          </a>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => globalThis.open(pdfPreviewUrl, '_blank', 'noopener')}
          >
            Abrir en nueva pestaña
          </button>
        </div>
      </>
    )
  }

  return <p className="text-sm text-gray-600">Genera el PDF para visualizar el expediente completo.</p>
}

const ESTADO_CAMPO = {
  CUMPLE: 'CUMPLE',
  OBSERVADO: 'OBSERVADO',
  PENDIENTE: 'PENDIENTE'
}

const DetalleRevision = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [solicitud, setSolicitud] = useState(null)
  const [archivos, setArchivos] = useState([])
  const [revisionServidor, setRevisionServidor] = useState([])
  const [camposRevision, setCamposRevision] = useState([])
  const [historial, setHistorial] = useState([])
  const [archivoNotas, setArchivoNotas] = useState({})
  const [comentarioGeneral, setComentarioGeneral] = useState('')
  const [comentarioDevolucion, setComentarioDevolucion] = useState('')
  const [comentarioTecnico, setComentarioTecnico] = useState('')
  const [motivoRechazoTecnico, setMotivoRechazoTecnico] = useState('')
  const [comentarioEncargado, setComentarioEncargado] = useState('')
  const [motivoDenegaEncargado, setMotivoDenegaEncargado] = useState('')
  const [comentarioDireccion, setComentarioDireccion] = useState('')
  const [motivoDireccionRechazo, setMotivoDireccionRechazo] = useState('')
  const [comentarioDncd, setComentarioDncd] = useState('')
  const [loading, setLoading] = useState(true)
  const [ventanillaSaving, setVentanillaSaving] = useState(false)
  const [tecnicoSaving, setTecnicoSaving] = useState(false)
  const [encargadoSaving, setEncargadoSaving] = useState(false)
  const [direccionSaving, setDireccionSaving] = useState(false)
  const [dncdSaving, setDncdSaving] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [archivoEnProceso, setArchivoEnProceso] = useState(null)
  const rolEmpleado = user?.rol || ''
  const esVentanilla = rolEmpleado === 'VENTANILLA'
  const esTecnico = rolEmpleado === 'TECNICO_UPC'
  const esEncargado = rolEmpleado === 'ENCARGADO_UPC'
  const esDireccion = rolEmpleado === 'DIRECCION'
  const esDncd = rolEmpleado === 'DNCD'

  let rutaRetorno = '/bandeja/ventanilla'
  if (esTecnico || esEncargado) {
    rutaRetorno = '/bandeja/upc'
  } else if (esDireccion) {
    rutaRetorno = '/bandeja/direccion'
  } else if (esDncd) {
    rutaRetorno = '/bandeja/dncd'
  }

  const autoTransicionVentanilla = useCallback(async (estado) => {
    const debeMoverse = ['CREADA', 'REGISTRADA', 'DEVUELTA_VENTANILLA'].includes(estado)
    if (!debeMoverse) return false

    try {
      await solicitudAPI.cambiarEstado(
        id,
        'EN_VENTANILLA',
        estado === 'DEVUELTA_VENTANILLA'
          ? 'Revisión retomada en ventanilla'
          : 'Recepción iniciada en ventanilla'
      )
      return true
    } catch (error) {
      toast.error(error?.message || 'No se pudo marcar la solicitud en ventanilla')
      return false
    }
  }, [id])

  const autoTransicionTecnico = useCallback(async (estado) => {
    const estadosPermitidos = ['VALIDADA', 'DEVUELTA_UPC']
    if (!estadosPermitidos.includes(estado)) {
      return false
    }

    try {
      await solicitudAPI.cambiarEstado(
        id,
        'EN_UPC',
        estado === 'DEVUELTA_UPC'
          ? 'Retomada por técnico UPC tras correcciones'
          : 'Ingreso automático a revisión técnica UPC'
      )
      return true
    } catch (error) {
      toast.error(error?.message || 'No se pudo marcar la solicitud en UPC')
      return false
    }
  }, [id])

  const autoTransicionEncargado = useCallback(async (estado) => {
    if (estado !== 'EN_REVISION_UPC') {
      return false
    }

    try {
      await solicitudAPI.cambiarEstado(
        id,
        'EN_ENCARGADO_UPC',
        'Ingreso automático por encargado UPC'
      )
      return true
    } catch (error) {
      toast.error(error?.message || 'No se pudo marcar la solicitud en revisión del encargado')
      return false
    }
  }, [id])

  const roleAutoTransiciones = useMemo(() => ({
    VENTANILLA: autoTransicionVentanilla,
    TECNICO_UPC: autoTransicionTecnico,
    ENCARGADO_UPC: autoTransicionEncargado
  }), [autoTransicionEncargado, autoTransicionTecnico, autoTransicionVentanilla])

  const autoTransicionSegunRol = useCallback(async (estadoActual) => {
    const estado = (estadoActual || '').toUpperCase()
    const handler = roleAutoTransiciones[rolEmpleado]
    if (!handler) {
      return false
    }
    return handler(estado)
  }, [roleAutoTransiciones, rolEmpleado])

  const cargarDatos = useCallback(async (options = {}) => {
    const omitirAutoTransicion = Boolean(options.omitirAutoTransicion)
    try {
      setLoading(true)
      const [detalle, archivosResp, revisionResp] = await Promise.all([
        solicitudAPI.obtener(id),
        archivoAPI.obtenerPorSolicitud(id),
        solicitudAPI.obtenerRevisionCampos(id)
      ])

      const solicitudDetalle = detalle.data
      setSolicitud(solicitudDetalle)
      setHistorial(solicitudDetalle?.historial || [])
      setRevisionServidor(revisionResp.data || solicitudDetalle?.revision_campos || [])
      setArchivos(archivosResp.data || [])
      setComentarioGeneral('')
      setComentarioDevolucion('')

      if (!omitirAutoTransicion) {
        const cambio = await autoTransicionSegunRol(solicitudDetalle?.estado_solicitud)
        if (cambio) {
          const detalleActualizado = await solicitudAPI.obtener(id)
          const dataActualizada = detalleActualizado.data
          setSolicitud(dataActualizada)
          setHistorial(dataActualizada?.historial || [])
        }
      }
    } catch (error) {
      toast.error(error?.message || 'No se pudo cargar la solicitud')
    } finally {
      setLoading(false)
    }
  }, [id, autoTransicionSegunRol])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    const notas = {}
    for (const archivo of archivos) {
      notas[archivo.id_archivo] = {
        estado: archivo.estado_archivo || 'PENDIENTE_REVISION',
        comentario: archivo.comentario_revision || ''
      }
    }
    setArchivoNotas(notas)
  }, [archivos])

  const serviceConfig = useMemo(() => {
    if (!solicitud?.id_tipo_servicio) return null
    return SERVICIO_FORM_CONFIG[solicitud.id_tipo_servicio] || null
  }, [solicitud?.id_tipo_servicio])

  const camposResumen = useMemo(() => {
    if (!solicitud) return []
    return buildCamposResumen(solicitud.datos_servicio, serviceConfig)
  }, [solicitud, serviceConfig])

  const generarPdfResolucion = useCallback(() => {
    if ((!esDireccion && !esDncd) || !solicitud) {
      return
    }

    setPdfLoading(true)

    const datosServicio = solicitud.datos_servicio || {}
    const sanitize = (value, fallback = '') => {
      if (value === undefined || value === null) return fallback
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed || fallback
      }
      if (typeof value === 'number') {
        return Number.isNaN(value) ? fallback : String(value)
      }
      return value || fallback
    }

    const getDato = (keys, fallback = '') => {
      const keyList = Array.isArray(keys) ? keys : [keys]
      for (const key of keyList) {
        if (!Object.prototype.hasOwnProperty.call(datosServicio, key)) continue
        const valor = datosServicio[key]
        if (valor === undefined || valor === null) continue
        if (typeof valor === 'string' && !valor.trim()) continue
        if (Array.isArray(valor) && valor.length === 0) continue
        return valor
      }
      return fallback
    }

    const toUpper = (valor) => sanitize(valor).toString().toUpperCase()

    const buildProfesionFlags = (valor) => {
      const normalized = toUpper(valor)
      const base = {
        medicina: normalized.includes('MEDIC') && !normalized.includes('VETERIN'),
        veterinaria: normalized.includes('VETERIN'),
        odontologia: normalized.includes('ODONTO'),
        otra: false,
        descripcion: normalized
      }
      base.otra = Boolean(normalized && !base.medicina && !base.veterinaria && !base.odontologia)
      return base
    }

    const normalizeCategorias = (raw) => {
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'object') {
        return Object.entries(raw)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key)
      }
      if (typeof raw === 'string') {
        return raw.split(/[,;/|]+/).map((item) => item.trim()).filter(Boolean)
      }
      return []
    }

    const categorias = (() => {
      const set = new Set(normalizeCategorias(
        getDato([
          'categorias_autorizadas',
          'categorias_droga',
          'categorias',
          'clases_autorizadas'
        ])
      ).map((item) => item.toUpperCase()))
      return {
        I: set.has('I'),
        II: set.has('II'),
        III: set.has('III'),
        IV: set.has('IV')
      }
    })()

    const profesionFlags = buildProfesionFlags(
      solicitud.profesion_solicitante || getDato(['profesion', 'ocupacion'])
    )

    const estatusOtra = toUpper(
      getDato(['estatus_otro_detalle', 'estatus_explicacion'], solicitud.motivo_detalle || '')
    )
    const estatusFlags = {
      primera: !solicitud.numero_cidc_anterior,
      renovacion: Boolean(solicitud.numero_cidc_anterior),
      anteriorNegada: Boolean(getDato(['solicitud_anterior_negada', 'estatus_negada'])),
      cidcReprobado: Boolean(getDato(['cidc_reprobado', 'estatus_cidc_reprobado'])),
      otra: Boolean(estatusOtra),
      otraDetalle: estatusOtra
    }

    const formatCurrency = (valor) => {
      const number = Number(valor ?? solicitud.monto_total_reportado)
      if (Number.isNaN(number)) return ''
      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
      }).format(number)
    }

    const formatDate = (valor) => {
      if (!valor) return ''
      const date = new Date(valor)
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-DO')
    }

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 36
      const pageSize = doc.internal.pageSize || {}
      const pageWidth = typeof pageSize.getWidth === 'function'
        ? pageSize.getWidth()
        : pageSize.width || 612
      const pageHeight = typeof pageSize.getHeight === 'function'
        ? pageSize.getHeight()
        : pageSize.height || 792
      const innerWidth = pageWidth - margin * 2
      let cursorY = margin

      const fillRectHex = (x, y, width, height, color, style = 'F') => {
        setFillColorHex(doc, color)
        doc.rect(x, y, width, height, style)
      }

      const strokeRectHex = (x, y, width, height, color) => {
        setStrokeColorHex(doc, color)
        doc.rect(x, y, width, height)
      }

      const drawFieldBlock = (label, value, x, y, width, height = 28) => {
        fillRectHex(x, y, width, height, PDF_COLOR_PALETTE.panel, 'F')
        strokeRectHex(x, y, width, height, PDF_COLOR_PALETTE.border)
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(148, 163, 184)
        doc.text(label, x + 6, y + 10)
        doc.setFont('helvetica', 'bold').setFontSize(11)
        const textValue = value === undefined || value === null || value === ''
          ? '________________'
          : String(value)
        doc.setTextColor(248, 250, 252)
        doc.text(textValue, x + 6, y + height - 10, { maxWidth: width - 12 })
      }

      const drawFieldRow = (columns, options = {}) => {
        const height = options.height ?? 30
        const gap = options.gap ?? 8
        const rowY = options.y ?? cursorY
        const totalSpan = columns.reduce((sum, column) => sum + (column.span || 1), 0)
        const startX = options.startX ?? margin
        const totalWidth = options.totalWidth ?? innerWidth
        let currentX = startX

        columns.forEach((column, index) => {
          const width = ((totalWidth - gap * (columns.length - 1)) * (column.span || 1)) / totalSpan
          drawFieldBlock(column.label, column.value, currentX, rowY, width, height)
          currentX += width + gap
        })

        cursorY = Math.max(cursorY, rowY + height + (options.afterGap ?? 6))
      }

      const drawSectionHeader = (label) => {
        setFillColorHex(doc, PDF_COLOR_PALETTE.section)
        setStrokeColorHex(doc, PDF_COLOR_PALETTE.border)
        doc.rect(margin, cursorY, innerWidth, 24, 'FD')
        doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(248, 250, 252)
        doc.text(label, margin + 10, cursorY + 16)
        cursorY += 30
      }

      const drawCheckbox = (x, y, label, checked, extra = '') => {
        const size = 12
        setStrokeColorHex(doc, checked ? PDF_COLOR_PALETTE.accent : PDF_COLOR_PALETTE.border)
        doc.rect(x, y, size, size)
        if (checked) {
          const { r, g, b } = parseHexColor(PDF_COLOR_PALETTE.accent)
          doc.setDrawColor(r, g, b)
          doc.line(x + 2, y + size / 2, x + size / 2 - 1, y + size - 2)
          doc.line(x + size / 2 - 1, y + size - 2, x + size - 2, y + 2)
        }
        doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(248, 250, 252)
        const labelText = extra ? `${label}: ${extra}` : label
        doc.text(labelText, x + size + 6, y + 10, { maxWidth: 180 })
      }

      const drawCheckboxRow = (items, options = {}) => {
        const gap = options.gap ?? 28
        const rowY = options.y ?? cursorY
        const widthPerItem = (innerWidth - gap * (items.length - 1)) / items.length
        items.forEach((item, idx) => {
          drawCheckbox(margin + idx * (widthPerItem + gap), rowY, item.label, item.checked, item.detail)
        })
        cursorY = Math.max(cursorY, rowY + (options.height ?? 20) + (options.afterGap ?? 8))
      }

      const drawNotas = () => {
        const paragraphLineHeight = 12

        doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(248, 250, 252)
        doc.text('Nota:', margin, cursorY)
        cursorY += 14

        doc.setFont('helvetica', 'normal').setFontSize(10)
        const notaLines = doc.splitTextToSize([
          'Este permiso no es válido si:',
          'a) No está debidamente firmado y sellado por los funcionarios autorizados por MSP y DNCD.',
          'b) Los renglones que lo conforman no están completos.',
          'c) Si se determina que los datos suministrados para su autorización no corresponden con la verdad.',
          'd) Tiene tachaduras o borraduras en su contenido.'
        ].join('\n'), innerWidth - 24)
        doc.text(notaLines, margin + 12, cursorY)
        cursorY += notaLines.length * paragraphLineHeight + 10

        doc.setFont('helvetica', 'bold').setFontSize(11)
        doc.text('Advertencia:', margin, cursorY)
        cursorY += 14

        doc.setFont('helvetica', 'normal').setFontSize(10)
        const advertenciaLines = doc.splitTextToSize(
          'El código Penal de la República Dominicana sanciona la falsificación, alteración o falsedad de escritura técnica o pública.',
          innerWidth - 24
        )
        doc.text(advertenciaLines, margin + 12, cursorY)
        cursorY += advertenciaLines.length * paragraphLineHeight + 20
      }

      fillRectHex(0, 0, pageWidth, pageHeight, PDF_COLOR_PALETTE.background)

      const centerX = margin + innerWidth / 2

      doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(248, 250, 252)
      drawAlignedText(doc, 'SOLICITUD', centerX, cursorY, 'center')
      cursorY += 24
      doc.setFontSize(12)
      drawAlignedText(doc, 'CERTIFICADO DE INSCRIPCIÓN DE SUSTANCIAS CONTROLADAS', centerX, cursorY, 'center')
      cursorY += 14
      drawAlignedText(doc, '- CLASE A -', centerX, cursorY, 'center')
      cursorY += 24

      doc.setFont('helvetica', 'normal').setFontSize(11)
      drawAlignedText(
        doc,
        `No. CIDC: ${sanitize(solicitud.numero_cidc_anterior || solicitud.numero_expediente || '')}`,
        margin + innerWidth,
        cursorY,
        'right'
      )
      cursorY += 12
      drawAlignedText(
        doc,
        `Expediente: ${solicitud.numero_expediente || solicitud.numero_solicitud || `Solicitud #${id}`}`,
        margin + innerWidth,
        cursorY,
        'right'
      )
      cursorY += 18

      drawSectionHeader('IDENTIFICACIÓN')
      drawFieldRow([
        { label: '1) Nombre del Profesional', value: toUpper(solicitud.nombre_solicitante) }
      ], { height: 34 })
      drawFieldRow([
        { label: '2) Dirección / Correo Postal (P.O.B)', value: toUpper(getDato(['direccion_postal', 'direccion'], solicitud.direccion_postal)) }
      ], { height: 34 })
      drawFieldRow([
        { label: '3) Cédula de Identidad y Electoral', value: toUpper(solicitud.identificador_solicitante || getDato(['cedula'])) },
        { label: '4) Exequátur', value: toUpper(getDato(['exequatur', 'numero_exequatur'])) },
        { label: '5) No. Colegiatura', value: toUpper(getDato(['colegiatura', 'numero_colegiatura'])) }
      ])
      drawFieldRow([
        { label: '6) Teléfono(s) Residencial', value: sanitize(getDato(['telefono_residencial'], solicitud.telefono_contacto)) },
        { label: '7) Celular', value: sanitize(getDato(['celular', 'telefono_celular'], solicitud.telefono_contacto)) }
      ])
      drawFieldRow([
        { label: '8) Lugar de Trabajo', value: toUpper(getDato(['lugar_trabajo', 'institucion', 'empresa'])) },
        { label: '9) E-mail', value: sanitize(solicitud.email_solicitante || getDato(['email'])) }
      ], { height: 30 })
      drawFieldRow([
        { label: '10) Dirección del Lugar de Trabajo', value: toUpper(getDato(['direccion_trabajo', 'direccion_empresa'])), span: 2 },
        { label: '11) Teléfono(s)', value: sanitize(getDato(['telefono_trabajo', 'telefono_oficina'])) }
      ], { height: 34 })

      cursorY += 6
      doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(248, 250, 252)
      doc.text('12) PROFESIÓN', margin, cursorY)
      cursorY += 14
      drawCheckboxRow([
        { label: 'a) Medicina', checked: profesionFlags.medicina },
        { label: 'b) Medicina Veterinaria', checked: profesionFlags.veterinaria }
      ], { height: 20 })
      drawCheckboxRow([
        { label: 'c) Odontología', checked: profesionFlags.odontologia },
        { label: 'd) Otra, especifique', checked: profesionFlags.otra, detail: profesionFlags.otra ? profesionFlags.descripcion : '' }
      ], { height: 20 })

      doc.text('13) ESTATUS', margin, cursorY)
      cursorY += 14
      drawCheckboxRow([
        { label: 'a) Primera Solicitud', checked: estatusFlags.primera },
        { label: 'b) Renovación', checked: estatusFlags.renovacion }
      ], { height: 20 })
      drawCheckboxRow([
        { label: 'c) Solicitud anterior negada', checked: estatusFlags.anteriorNegada },
        { label: 'd) CIDC reprobado, suspendido', checked: estatusFlags.cidcReprobado }
      ], { height: 20 })
      drawCheckboxRow([
        { label: 'e) Otra, especifique', checked: estatusFlags.otra, detail: estatusFlags.otra ? estatusFlags.otraDetalle : '' }
      ], { height: 20 })

      doc.setFont('helvetica', 'bold').setFontSize(10)
      doc.text('Categorías de Drogas Controladas que tendrá derecho a prescribir o administrar:', margin, cursorY)
      cursorY += 12
      drawCheckboxRow([
        { label: 'I', checked: categorias.I },
        { label: 'II', checked: categorias.II },
        { label: 'III', checked: categorias.III },
        { label: 'IV', checked: categorias.IV }
      ], { gap: 36, height: 20 })

      drawFieldRow([
        { label: 'Si su respuesta fue b o d, No. CIDC', value: toUpper(solicitud.numero_cidc_anterior || solicitud.numero_expediente || '') },
        { label: 'Si su respuesta fue c, d o e explique el motivo en el reverso (Renglón No. 13)', value: estatusFlags.otraDetalle }
      ], { height: 36 })

      drawFieldRow([
        { label: '14) SUMA A PAGAR: RD$', value: formatCurrency(solicitud.monto_total_reportado || getDato(['suma_pagar'])) },
        { label: 'Fecha solicitud', value: formatDate(solicitud.fecha_creacion) },
        { label: 'Firma Interesado', value: '' }
      ], { height: 32 })

      const usoInternoWidth = innerWidth * 0.35
      fillRectHex(margin, cursorY, usoInternoWidth, 34, PDF_COLOR_PALETTE.section, 'FD')
      doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(248, 250, 252)
      doc.text('SÓLO PARA USO INTERNO', margin + 12, cursorY + 22)
      drawFieldRow([
        { label: 'Fecha aprobado', value: formatDate(solicitud.fecha_actualizacion) },
        { label: 'No. Factura', value: sanitize(getDato(['numero_factura'], solicitud.resumen_pago_label)) },
        { label: 'Fecha pago', value: formatDate(getDato(['fecha_pago'])) }
      ], {
        startX: margin + usoInternoWidth + 10,
        totalWidth: innerWidth - usoInternoWidth - 10,
        y: cursorY,
        height: 34,
        afterGap: 12
      })

      cursorY += 24
      drawNotas()

      const pdfUri = doc.output('datauristring')
      setPdfPreviewUrl(pdfUri)
    } catch (error) {
      console.error('Error generando PDF para Dirección:', error)
      toast.error('No se pudo generar el PDF de la solicitud')
    } finally {
      setPdfLoading(false)
    }
  }, [esDireccion, esDncd, id, solicitud])

  useEffect(() => {
    if (!camposResumen || camposResumen.length === 0) {
      setCamposRevision([])
      return
    }

    const mapRevision = new Map()
    for (const rev of revisionServidor) {
      mapRevision.set(rev.nombre_campo || rev.etiqueta_campo, rev)
    }

    const items = camposResumen.map((campo) => {
      const key = campo.key || campo.label
      const existente = mapRevision.get(key) || mapRevision.get(campo.label)
      return {
        key,
        label: campo.label,
        valor: campo.valor,
        estado: existente?.estado_campo || ESTADO_CAMPO.PENDIENTE,
        comentario: existente?.comentario_revision || ''
      }
    })

    setCamposRevision(items)
  }, [camposResumen, revisionServidor])

  const headerInfo = useMemo(() => {
    const servicioNombre =
      solicitud?.nombre_servicio ||
      TIPOS_SERVICIO_MAP[solicitud?.id_tipo_servicio]?.nombre ||
      'Servicio no disponible'
    const tramiteNombre =
      solicitud?.nombre_tramite ||
      TIPOS_TRAMITE_MAP[solicitud?.id_tipo_tramite]?.nombre ||
      'Trámite no disponible'

    return {
      numero: solicitud?.numero_expediente || solicitud?.numero_solicitud || `Solicitud #${id}`,
      servicio: servicioNombre,
      tramite: tramiteNombre,
      estado: solicitud?.estado_solicitud || 'SIN ESTADO'
    }
  }, [id, solicitud])

  const resumenEstados = useMemo(() => (
    camposRevision.reduce((acc, campo) => {
      acc[campo.estado] = (acc[campo.estado] || 0) + 1
      return acc
    }, {})
  ), [camposRevision])

  const camposPendientes = camposRevision.some((campo) => campo.estado === ESTADO_CAMPO.PENDIENTE)
  const tieneObservados = camposRevision.some((campo) => campo.estado === ESTADO_CAMPO.OBSERVADO)
  const archivosPendientes = Object.values(archivoNotas).some((nota) => nota.estado !== 'CUMPLE')

  const pdfPreviewContent = useMemo(
    () => buildPdfPreviewContent({ pdfLoading, pdfPreviewUrl, solicitud }),
    [pdfLoading, pdfPreviewUrl, solicitud]
  )

  useEffect(() => {
    if (!esDireccion && !esDncd) {
      setPdfPreviewUrl('')
      return
    }

    if (solicitud) {
      generarPdfResolucion()
    }
  }, [esDireccion, esDncd, generarPdfResolucion, solicitud])

  const handleCampoEstadoChange = (index, estado) => {
    setCamposRevision((prev) => prev.map((campo, idx) => (idx === index ? { ...campo, estado } : campo)))
  }

  const handleCampoComentarioChange = (index, comentario) => {
    setCamposRevision((prev) => prev.map((campo, idx) => (idx === index ? { ...campo, comentario } : campo)))
  }

  const handleArchivoNotasChange = (idArchivo, field, value) => {
    setArchivoNotas((prev) => ({
      ...prev,
      [idArchivo]: {
        ...prev[idArchivo],
        [field]: value
      }
    }))
  }

  const guardarRevisionArchivo = async (archivo) => {
    const notas = archivoNotas[archivo.id_archivo]
    if (!notas?.estado || notas.estado === 'PENDIENTE_REVISION') {
      toast.error('Selecciona si el archivo cumple o no')
      return
    }

    if (notas.estado === 'NO_CUMPLE' && !notas.comentario?.trim()) {
      toast.error('Describe el motivo cuando el archivo no cumple')
      return
    }

    try {
      setArchivoEnProceso(archivo.id_archivo)
      const resultado = await archivoAPI.actualizarRevision(
        archivo.id_archivo,
        notas.estado,
        notas.comentario
      )
      const dataArchivo = resultado.data || resultado
      setArchivos((prev) => prev.map((item) => (item.id_archivo === archivo.id_archivo ? dataArchivo : item)))
      toast.success('Archivo actualizado')
    } catch (error) {
      toast.error(error?.message || 'No se pudo actualizar el archivo')
    } finally {
      setArchivoEnProceso(null)
    }
  }

  const descargarArchivo = async (archivo) => {
    try {
      const blob = await archivoAPI.descargar(archivo.id_archivo)
      const url = globalThis.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', archivo.nombre_archivo)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('No se pudo descargar el archivo:', error)
      toast.error('No se pudo descargar el archivo')
    }
  }

  const persistirRevisionCampos = async () => {
    await solicitudAPI.guardarRevisionCampos(
      id,
      camposRevision.map((campo) => {
        const key = campo.key || campo.label
        return {
          nombre_campo: key,
          etiqueta_campo: campo.label,
          valor_reportado: campo.valor,
          estado_campo: campo.estado,
          comentario_revision: campo.comentario
        }
      })
    )
  }

  const handleValidar = async () => {
    if (camposRevision.length === 0) {
      toast.error('No hay campos para validar')
      return
    }

    if (camposPendientes) {
      toast.error('Debes revisar todos los campos del formulario')
      return
    }

    if (archivosPendientes) {
      toast.error('Todos los archivos deben estar marcados como CUMPLE')
      return
    }

    try {
      setVentanillaSaving(true)
      await persistirRevisionCampos()
      await solicitudAPI.cambiarEstado(
        id,
        'VALIDADA',
        comentarioGeneral || 'Solicitud validada en ventanilla'
      )
      toast.success('Solicitud enviada a UPC')
      navigate('/bandeja/ventanilla')
    } catch (error) {
      toast.error(error?.message || 'No se pudo validar la solicitud')
    } finally {
      setVentanillaSaving(false)
    }
  }

  const handleDevolver = async () => {
    if (!comentarioDevolucion.trim()) {
      toast.error('Indica el motivo de devolución para el solicitante')
      return
    }

    if (!tieneObservados) {
      toast.error('Marca al menos un campo como observado antes de devolver')
      return
    }

    try {
      setVentanillaSaving(true)
      await persistirRevisionCampos()
      await solicitudAPI.cambiarEstado(
        id,
        'DEVUELTA_VENTANILLA',
        comentarioDevolucion.trim()
      )
      toast.success('Solicitud devuelta al solicitante')
      navigate('/bandeja/ventanilla')
    } catch (error) {
      toast.error(error?.message || 'No se pudo devolver la solicitud')
    } finally {
      setVentanillaSaving(false)
    }
  }

  const checklistTecnicoCompleto = () => {
    if (camposRevision.length === 0) {
      toast.error('No hay campos configurados para validar')
      return false
    }

    if (camposPendientes) {
      toast.error('Debes revisar todos los campos del formulario')
      return false
    }

    if (archivosPendientes) {
      toast.error('Todos los archivos deben estar marcados como CUMPLE antes de continuar')
      return false
    }

    return true
  }

  const handleTecnicoEnviarEncargado = async () => {
    if (!esTecnico) return
    if (!checklistTecnicoCompleto()) return

    try {
      setTecnicoSaving(true)
      await persistirRevisionCampos()
      await solicitudAPI.cambiarEstado(
        id,
        'EN_REVISION_UPC',
        comentarioTecnico.trim() || 'Evaluación técnica completada. Recomendación: aprobar.'
      )
      toast.success('Expediente enviado al encargado UPC')
      navigate(rutaRetorno)
    } catch (error) {
      toast.error(error?.message || 'No se pudo enviar al encargado UPC')
    } finally {
      setTecnicoSaving(false)
    }
  }

  const handleTecnicoRechazar = async () => {
    if (!motivoRechazoTecnico.trim()) {
      toast.error('Describe el motivo de la recomendación de rechazo')
      return
    }
    if (!checklistTecnicoCompleto()) return

    try {
      setTecnicoSaving(true)
      await persistirRevisionCampos()
      await solicitudAPI.cambiarEstado(
        id,
        'EN_REVISION_UPC',
        `Recomendación de rechazo técnico: ${motivoRechazoTecnico.trim()}`
      )
      toast.success('Recomendación registrada y enviada al encargado UPC')
      navigate(rutaRetorno)
    } catch (error) {
      toast.error(error?.message || 'No se pudo registrar la recomendación de rechazo')
    } finally {
      setTecnicoSaving(false)
    }
  }

  const handleEncargadoAprobar = async () => {

    try {
      setEncargadoSaving(true)
      await solicitudAPI.cambiarEstado(
        id,
        'EN_DIRECCION',
        comentarioEncargado.trim() || 'Aprobado por encargado UPC'
      )
      toast.success('Solicitud enviada a Dirección para firma final')
      navigate(rutaRetorno)
    } catch (error) {
      toast.error(error?.message || 'No se pudo enviar a Dirección')
    } finally {
      setEncargadoSaving(false)
    }
  }

  const handleEncargadoDenegar = async () => {
    if (!motivoDenegaEncargado.trim()) {
      toast.error('Debes describir el motivo de la denegación')
      return
    }

    try {
      setEncargadoSaving(true)
      await solicitudAPI.cambiarEstado(
        id,
        'DENEGADA',
        motivoDenegaEncargado.trim()
      )
      toast.success('Solicitud denegada y remitida a Dirección para notificación')
      navigate(rutaRetorno)
    } catch (error) {
      toast.error(error?.message || 'No se pudo denegar la solicitud')
    } finally {
      setEncargadoSaving(false)
    }
  }

  const handleDireccionAprobar = async () => {

    try {
      setDireccionSaving(true)
      await solicitudAPI.cambiarEstado(
        id,
        'EN_DNCD',
        comentarioDireccion.trim() || 'Aprobada por Dirección. Enviada a DNCD para no objeción.'
      )
      toast.success('Solicitud aprobada y enviada a DNCD')
      navigate('/bandeja/direccion')
    } catch (error) {
      toast.error(error?.message || 'No se pudo enviar la solicitud a DNCD')
    } finally {
      setDireccionSaving(false)
    }
  }

  const handleDireccionRechazar = async () => {
    if (!motivoDireccionRechazo.trim()) {
      toast.error('Debes indicar el motivo de la denegación')
      return
    }

    try {
      setDireccionSaving(true)
      await solicitudAPI.cambiarEstado(
        id,
        'RECHAZADA',
        motivoDireccionRechazo.trim()
      )
      toast.success('Solicitud rechazada y notificada al solicitante')
      navigate('/bandeja/direccion')
    } catch (error) {
      toast.error(error?.message || 'No se pudo denegar la solicitud')
    } finally {
      setDireccionSaving(false)
    }
  }

  const handleFirmaPlaceholder = () => {
    toast('La firma digital se integrará próximamente. Mantente atento.', { icon: '✍️' })
  }

  const handleDncdEnviarSolicitante = async () => {

    try {
      setDncdSaving(true)
      await solicitudAPI.cambiarEstado(
        id,
        'CERTIFICADO_EMITIDO',
        comentarioDncd.trim() || 'DNCD emitió no objeción y remite el PDF firmado al solicitante.'
      )
      toast.success('Resolución enviada al solicitante')
      navigate('/bandeja/dncd')
    } catch (error) {
      toast.error(error?.message || 'No se pudo enviar la resolución al solicitante')
    } finally {
      setDncdSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
      </div>
    )
  }

  if (!solicitud) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-950 mb-4"
        >
          <FiArrowLeft /> Volver
        </button>
        <p className="text-center text-gray-600">Solicitud no encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-950 hover:text-primary-700"
      >
        <FiArrowLeft /> Volver a Bandeja
      </button>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Expediente</p>
            <h1 className="text-3xl font-bold text-primary-950">{headerInfo.numero}</h1>
            <p className="text-gray-600 mt-1">{headerInfo.servicio}</p>
            <p className="text-sm text-gray-500">{headerInfo.tramite}</p>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
            {headerInfo.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-primary-950 mb-4">Información del solicitante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nombre / Razón social</p>
                <p className="font-semibold text-primary-950">{solicitud.nombre_solicitante || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gray-500">Tipo de solicitante</p>
                <p className="font-semibold text-primary-950">{solicitud.tipo_solicitante || 'No indicado'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-primary-950">{solicitud.email_solicitante || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="font-semibold text-primary-950">{solicitud.telefono_contacto || 'No registrado'}</p>
              </div>
              {solicitud.identificador_solicitante && (
                <div>
                  <p className="text-gray-500">Identificador</p>
                  <p className="font-semibold text-primary-950">{solicitud.identificador_solicitante}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary-950">Validación de campos</h2>
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-700">
                  <FiCheckCircle /> {resumenEstados[ESTADO_CAMPO.CUMPLE] || 0} cumplen
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <FiAlertTriangle /> {resumenEstados[ESTADO_CAMPO.OBSERVADO] || 0} observados
                </span>
              </div>
            </div>

            {camposRevision.length === 0 ? (
              <p className="text-gray-600">No hay campos asociados a esta solicitud.</p>
            ) : (
              <div className="space-y-4">
                {camposRevision.map((campo, index) => (
                  <div key={campo.key || campo.label} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{campo.label}</p>
                        <p className="font-semibold text-primary-950">{campo.valor}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className={`px-3 py-1 rounded text-sm border ${campo.estado === ESTADO_CAMPO.CUMPLE ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700'}`}
                          onClick={() => handleCampoEstadoChange(index, ESTADO_CAMPO.CUMPLE)}
                        >
                          Cumple
                        </button>
                        <button
                          className={`px-3 py-1 rounded text-sm border ${campo.estado === ESTADO_CAMPO.OBSERVADO ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-300 text-gray-700'}`}
                          onClick={() => handleCampoEstadoChange(index, ESTADO_CAMPO.OBSERVADO)}
                        >
                          Observado
                        </button>
                      </div>
                    </div>
                    {campo.estado === ESTADO_CAMPO.OBSERVADO && (
                      <textarea
                        className="textarea mt-3"
                        placeholder="Describe la observación para el solicitante"
                        value={campo.comentario}
                        onChange={(e) => handleCampoComentarioChange(index, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-primary-950 mb-4">Documentos cargados</h2>
            {archivos.length === 0 ? (
              <p className="text-gray-600">No se cargaron archivos para esta solicitud.</p>
            ) : (
              <div className="space-y-3">
                {archivos.map((archivo) => (
                  <div key={archivo.id_archivo} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary-950">{archivo.nombre_archivo}</p>
                        <p className="text-xs text-gray-500">{archivo.tipo_archivo}</p>
                      </div>
                      <button
                        onClick={() => descargarArchivo(archivo)}
                        className="text-accent-600 hover:text-accent-700"
                      >
                        <FiDownload />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <select
                        className="select"
                        value={archivoNotas[archivo.id_archivo]?.estado || 'PENDIENTE_REVISION'}
                        onChange={(e) => handleArchivoNotasChange(archivo.id_archivo, 'estado', e.target.value)}
                      >
                        <option value="PENDIENTE_REVISION">Pendiente de revisión</option>
                        <option value="CUMPLE">Cumple</option>
                        <option value="NO_CUMPLE">No cumple</option>
                      </select>
                      <textarea
                        className="textarea md:col-span-2"
                        placeholder="Comentario (obligatorio si no cumple)"
                        value={archivoNotas[archivo.id_archivo]?.comentario || ''}
                        onChange={(e) => handleArchivoNotasChange(archivo.id_archivo, 'comentario', e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => guardarRevisionArchivo(archivo)}
                      className="btn-primary"
                      disabled={archivoEnProceso === archivo.id_archivo}
                    >
                      {archivoEnProceso === archivo.id_archivo ? 'Guardando...' : 'Guardar revisión'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {esVentanilla && (
            <div className="card">
              <h2 className="text-xl font-bold text-primary-950 mb-4">Acciones</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1" htmlFor="comentarioUPC">Comentario para UPC</label>
                  <textarea
                    id="comentarioUPC"
                    className="textarea"
                    placeholder="Notas internas una vez validada la solicitud"
                    value={comentarioGeneral}
                    onChange={(e) => setComentarioGeneral(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1" htmlFor="motivoDevolucion">Motivo de devolución</label>
                  <textarea
                    id="motivoDevolucion"
                    className="textarea"
                    placeholder="Se requiere para devolver al solicitante"
                    value={comentarioDevolucion}
                    onChange={(e) => setComentarioDevolucion(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="btn-primary"
                    onClick={handleValidar}
                    disabled={ventanillaSaving}
                  >
                    {ventanillaSaving ? 'Procesando...' : 'Validar y enviar a UPC'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleDevolver}
                    disabled={ventanillaSaving}
                  >
                    Devolver al solicitante
                  </button>
                </div>
              </div>
            </div>
          )}

          {esTecnico && (
            <div className="card space-y-4">
              <h2 className="text-xl font-bold text-primary-950">Decisiones del técnico UPC</h2>
              <p className="text-sm text-gray-600">
                Al abrir la solicitud se marcó automáticamente como <strong>EN_UPC</strong>. Completa la verificación,
                deja tus notas y envíala al encargado.
              </p>
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="notasTecnico">Notas o hallazgos</label>
                <textarea
                  id="notasTecnico"
                  className="textarea"
                  placeholder="Contexto para el encargado UPC"
                  value={comentarioTecnico}
                  onChange={(e) => setComentarioTecnico(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="rechazoTecnico">Recomendación de rechazo (opcional)</label>
                <textarea
                  id="rechazoTecnico"
                  className="textarea"
                  placeholder="Describe el motivo si consideras que debe denegarse"
                  value={motivoRechazoTecnico}
                  onChange={(e) => setMotivoRechazoTecnico(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  className="btn-primary"
                  onClick={handleTecnicoEnviarEncargado}
                  disabled={tecnicoSaving}
                >
                  {tecnicoSaving ? 'Enviando...' : 'Enviar al encargado UPC'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleTecnicoRechazar}
                  disabled={tecnicoSaving}
                >
                  Recomendar denegación
                </button>
              </div>
            </div>
          )}

          {esEncargado && (
            <div className="card space-y-4">
              <h2 className="text-xl font-bold text-primary-950">Resolución del encargado UPC</h2>
              <p className="text-sm text-gray-600">
                Al abrir se marcó como <strong>EN_ENCARGADO_UPC</strong> para dejar constancia de tu revisión. Repasa las notas del técnico y decide si pasa a Dirección o se deniega.
              </p>
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="comentarioEncargado">Comentario para Dirección</label>
                <textarea
                  id="comentarioEncargado"
                  className="textarea"
                  placeholder="Opcional, se mostrará en el historial"
                  value={comentarioEncargado}
                  onChange={(e) => setComentarioEncargado(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="motivoDenegaEncargado">Motivo de denegación</label>
                <textarea
                  id="motivoDenegaEncargado"
                  className="textarea"
                  placeholder="Requerido solo si decides denegar"
                  value={motivoDenegaEncargado}
                  onChange={(e) => setMotivoDenegaEncargado(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button
                  className="btn-primary"
                  onClick={handleEncargadoAprobar}
                  disabled={encargadoSaving}
                >
                  {encargadoSaving ? 'Enviando...' : 'Aprobar y enviar a Dirección'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleEncargadoDenegar}
                  disabled={encargadoSaving}
                >
                  Denegar y notificar
                </button>
              </div>
            </div>
          )}

          {esDireccion && (
            <>
              <div className="card space-y-4">
                <h2 className="text-xl font-bold text-primary-950">Resolución de Dirección</h2>
                <p className="text-sm text-gray-600">
                  Solo puedes aprobar y firmar o denegar y firmar. Al aprobar se enviará a DNCD; al denegar, el solicitante deberá reiniciar el trámite.
                </p>
                <div>
                  <label className="block text-sm text-gray-600 mb-1" htmlFor="comentarioDireccion">Comentario interno (opcional)</label>
                  <textarea
                    id="comentarioDireccion"
                    className="textarea"
                    placeholder="Notas o instrucciones adicionales"
                    value={comentarioDireccion}
                    onChange={(e) => setComentarioDireccion(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1" htmlFor="motivoDireccionRechazo">Motivo de denegación</label>
                  <textarea
                    id="motivoDireccionRechazo"
                    className="textarea"
                    placeholder="Obligatorio solo al denegar"
                    value={motivoDireccionRechazo}
                    onChange={(e) => setMotivoDireccionRechazo(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Si apruebas, este campo puede quedar vacío.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="btn-primary"
                    onClick={handleDireccionAprobar}
                    disabled={direccionSaving}
                  >
                    {direccionSaving ? 'Procesando...' : 'Aprobar, firmar y enviar a DNCD'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleDireccionRechazar}
                    disabled={direccionSaving}
                  >
                    {direccionSaving ? 'Procesando...' : 'Denegar y notificar al solicitante'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={handleFirmaPlaceholder}
                  >
                    Firmar resolución (próximamente)
                  </button>
                </div>
              </div>

              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-primary-950">Vista PDF para Dirección</h2>
                  <button
                    className="btn-secondary"
                    onClick={generarPdfResolucion}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? 'Generando...' : 'Actualizar PDF'}
                  </button>
                </div>
                {pdfPreviewContent}
              </div>
            </>
          )}

          {esDncd && (
            <>
              <div className="card space-y-4">
                <h2 className="text-xl font-bold text-primary-950">Revisión DNCD y envío al solicitante</h2>
                <p className="text-sm text-gray-600">
                  Verifica el PDF firmado por Dirección, agrega observaciones si aplica y envíalo al solicitante para finalizar el trámite.
                </p>
                <div>
                  <label className="block text-sm text-gray-600 mb-1" htmlFor="comentarioDncd">Comentario para el solicitante (opcional)</label>
                  <textarea
                    id="comentarioDncd"
                    className="textarea"
                    placeholder="Este texto se incluirá en la notificación al solicitante"
                    value={comentarioDncd}
                    onChange={(e) => setComentarioDncd(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    className="btn-primary"
                    onClick={handleDncdEnviarSolicitante}
                    disabled={dncdSaving}
                  >
                    {dncdSaving ? 'Enviando...' : 'Enviar al solicitante y cerrar expediente'}
                  </button>
                </div>
              </div>

              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-primary-950">PDF firmado por Dirección</h2>
                  <button
                    className="btn-secondary"
                    onClick={generarPdfResolucion}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? 'Generando...' : 'Recargar PDF'}
                  </button>
                </div>
                {pdfPreviewContent}
              </div>
            </>
          )}

          <div className="card">
            <h2 className="text-xl font-bold text-primary-950 mb-4">Historial</h2>
            {historial.length === 0 ? (
              <p className="text-gray-600 text-sm">Sin movimientos registrados.</p>
            ) : (
              <div className="space-y-4">
                {historial.map((evento, idx) => (
                  <div key={evento.id_historial || idx} className="relative">
                    {idx < historial.length - 1 && (
                      <div className="absolute left-4 top-8 w-1 h-6 bg-accent-600"></div>
                    )}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-600 flex-shrink-0 flex items-center justify-center">
                        <FiChevronRight className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-primary-950 text-sm">
                          {evento.estado_nuevo || 'Actualización'}
                        </p>
                        <p className="text-xs text-gray-600">{new Date(evento.fecha_cambio).toLocaleString('es-DO')}</p>
                        {(evento.empleado_nombre || evento.empleado_rol) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Atendido por {evento.empleado_nombre || 'Empleado'}
                            {evento.empleado_rol ? ` (${evento.empleado_rol})` : ''}
                          </p>
                        )}
                        {(evento.motivo_cambio || evento.comentario_adicional) && (
                          <p className="text-xs text-gray-700 mt-1">
                            {evento.motivo_cambio || evento.comentario_adicional}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetalleRevision

/* eslint-enable complexity */
