import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { solicitudAPI, archivoAPI, certificadoAPI } from '../../services/api'
import jsPDF from 'jspdf'
import toast from 'react-hot-toast'
import { FiDownload, FiChevronRight } from 'react-icons/fi'
import SERVICIO_FORM_CONFIG from '../../config/serviciosFormConfig'
import {
  TIPOS_SERVICIO_MAP,
  TIPOS_TRAMITE_MAP
} from '../../constants/solicitudOptions'
import { buildCamposResumen } from '../../utils/solicitudHelpers'
import { useAuthStore } from '../../store/authStore'

const logError = (message, error) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(message, error)
  }
}

const DetalleSolicitud = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAuthStore((state) => state.user)
  const justCreated = Boolean(location.state?.justCreated)
  const justResubmitted = Boolean(location.state?.justResubmitted)
  const wizardSummary = location.state?.wizardSummary || null
  const [solicitud, setSolicitud] = useState(null)
  const [archivos, setArchivos] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [certificado, setCertificado] = useState(null)
  const [certificadoLoading, setCertificadoLoading] = useState(false)
  const [descargandoCertificado, setDescargandoCertificado] = useState(false)

  const puedeCorregir = solicitud?.estado_solicitud === 'DEVUELTA_VENTANILLA'
  const estadoSolicitud = (solicitud?.estado_solicitud || 'SIN_ESTADO').toUpperCase()
  const estadosConCertificado = useMemo(() => new Set(['CERTIFICADO_EMITIDO', 'COMPLETADA']), [])
  const debeMostrarCertificado = estadosConCertificado.has(estadoSolicitud)
  const estaEnDncd = estadoSolicitud === 'EN_DNCD'

  const resolveCertificadoId = useCallback((registro) => {
    if (!registro) return null
    return (
      registro.id_certificado ??
      registro.idCertificado ??
      registro.ID_CERTIFICADO ??
      registro.id ??
      registro.id_cert ??
      null
    )
  }, [])

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true)
      const [dataSolicitud, dataArchivos] = await Promise.all([
        solicitudAPI.obtener(id),
        archivoAPI.obtenerPorSolicitud(id)
      ])

      const solicitudDetallada = dataSolicitud.data
      setSolicitud(solicitudDetallada)

      const archivosNormalizados = (dataArchivos.data || []).map((archivo) => ({
        ...archivo,
        estado_cliente:
          archivo.estado_archivo || archivo.estado_revision || 'PENDIENTE_REVISION',
        fecha_visible:
          archivo.fecha_revision || archivo.fecha_carga || archivo.fecha_subida || null
      }))
      setArchivos(archivosNormalizados)
      setHistorial(solicitudDetallada?.historial || [])
    } catch (error) {
      logError('Error al cargar detalle de solicitud', error)
      toast.error('Error al cargar información')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const serviceConfig = useMemo(() => {
    if (!solicitud?.id_tipo_servicio) return null
    return SERVICIO_FORM_CONFIG[solicitud.id_tipo_servicio] || null
  }, [solicitud?.id_tipo_servicio])

  const camposResumen = useMemo(() => {
    const campos = buildCamposResumen(solicitud?.datos_servicio, serviceConfig)
    if (campos.length > 0) {
      return campos
    }
    return wizardSummary?.campos || []
  }, [serviceConfig, solicitud?.datos_servicio, wizardSummary])

  const camposObservados = useMemo(() => {
    if (!Array.isArray(solicitud?.revision_campos)) {
      return []
    }
    return solicitud.revision_campos
      .filter((campo) => (campo.estado_campo || campo.estado || '').toUpperCase() === 'OBSERVADO')
      .map((campo, index) => ({
        id: campo.id_revision || `${campo.nombre_campo || 'campo'}-${index}`,
        etiqueta: campo.etiqueta_campo || campo.nombre_campo || 'Campo observado',
        comentario: campo.comentario_revision || 'Sin detalle',
        fecha: campo.fecha_revision || null
      }))
  }, [solicitud?.revision_campos])

  const motivoDevolucion = useMemo(() => {
    if (!Array.isArray(historial) || historial.length === 0) {
      return null
    }
    const eventoDevuelto = historial.find((evento) =>
      (evento.estado_nuevo || evento.estado_destino || '').toUpperCase().startsWith('DEVUELTA')
    )
    return eventoDevuelto?.motivo_cambio || eventoDevuelto?.comentario_adicional || null
  }, [historial])

  useEffect(() => {
    const shouldLoad = debeMostrarCertificado && solicitud?.id_solicitud
    if (!shouldLoad) {
      setCertificado(null)
      return
    }

    let isActive = true
    const fetchCertificado = async () => {
      try {
        setCertificadoLoading(true)
        const respuesta = await certificadoAPI.obtenerPorSolicitud(solicitud.id_solicitud)
        const registros = Array.isArray(respuesta.data) ? respuesta.data : []
        const masReciente = registros
          .slice()
          .sort((a, b) => new Date(b.fecha_emision || 0) - new Date(a.fecha_emision || 0))[0] || null
        if (isActive) {
          setCertificado(masReciente)
        }
      } catch (error) {
        if (isActive) {
          setCertificado(null)
          logError('Error al buscar certificado emitido', error)
        }
      } finally {
        if (isActive) {
          setCertificadoLoading(false)
        }
      }
    }

    fetchCertificado()
    return () => {
      isActive = false
    }
  }, [debeMostrarCertificado, solicitud?.id_solicitud])

  const certificadoId = useMemo(() => resolveCertificadoId(certificado), [certificado, resolveCertificadoId])

  const generarPdfProvisional = useCallback(() => {
    if (!solicitud) {
      toast.error('Aún no podemos preparar tu certificado')
      return
    }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    let cursorY = 60

    doc.setFontSize(18)
    doc.text('Constancia de emisión - MSP / DNCD', 40, cursorY)
    cursorY += 26
    doc.setFontSize(12)
    doc.text(`Expediente: ${solicitud.numero_expediente || solicitud.numero_solicitud || id}`, 40, cursorY)
    cursorY += 18
    doc.text(`Solicitante: ${solicitud.nombre_solicitante || 'No disponible'}`, 40, cursorY)
    cursorY += 18
    doc.text(`Estado: ${estadoSolicitud}`, 40, cursorY)
    cursorY += 24
    doc.setFontSize(13)
    doc.text('Resumen de campos reportados', 40, cursorY)
    cursorY += 18
    doc.setFontSize(11)
    const campos = camposResumen.slice(0, 15)
    if (campos.length === 0) {
      doc.text('No hay campos configurados para esta solicitud.', 40, cursorY)
    } else {
      for (const campo of campos) {
        doc.text(`• ${campo.label}: ${campo.valor}`, 50, cursorY)
        cursorY += 14
        if (cursorY > 760) {
          doc.addPage()
          cursorY = 40
        }
      }
    }

    cursorY += 20
    doc.setFontSize(11)
    doc.text('Este documento es una constancia provisional mientras se adjunta el certificado firmado.', 40, cursorY)
    doc.save(`constancia-certificado-${solicitud.id_solicitud || id}.pdf`)
  }, [camposResumen, estadoSolicitud, id, solicitud])

  const descargarCertificadoFirmado = useCallback(async () => {
    try {
      setDescargandoCertificado(true)
      const blob = certificadoId
        ? await certificadoAPI.descargarPDF(certificadoId)
        : await certificadoAPI.descargarPDFPorSolicitud(solicitud?.id_solicitud || id)
      const url = globalThis.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `certificado-${certificadoId || solicitud?.id_solicitud || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      globalThis.URL.revokeObjectURL(url)
    } catch (error) {
      logError('No se pudo descargar el certificado', error)
      toast.error('No se pudo descargar el certificado emitido')
      generarPdfProvisional()
    } finally {
      setDescargandoCertificado(false)
    }
  }, [certificadoId, generarPdfProvisional, id, solicitud?.id_solicitud])

  const documentosResumen = useMemo(() => {
    if (
      Array.isArray(solicitud?.documentos_reportados) &&
      solicitud.documentos_reportados.length > 0
    ) {
      return solicitud.documentos_reportados
    }
    return wizardSummary?.documentos || []
  }, [solicitud?.documentos_reportados, wizardSummary])

  const headerInfo = useMemo(() => {
    const servicioNombre =
      solicitud?.nombre_servicio ||
      TIPOS_SERVICIO_MAP[solicitud?.id_tipo_servicio]?.nombre ||
      wizardSummary?.tipoServicio ||
      'Servicio no disponible'
    const tramiteNombre =
      solicitud?.nombre_tramite ||
      TIPOS_TRAMITE_MAP[solicitud?.id_tipo_tramite]?.nombre ||
      wizardSummary?.tipoTramite ||
      'Trámite no disponible'

    return {
      numero:
        solicitud?.numero_expediente ||
        solicitud?.numero_solicitud ||
        `Solicitud #${id}`,
      servicio: servicioNombre,
      tramite: tramiteNombre,
      monto: solicitud?.monto_total_reportado ?? solicitud?.pago?.monto_total ?? 0
    }
  }, [id, solicitud, wizardSummary])

  const detalleTramiteExtra = useMemo(() => ({
    numeroCIDC:
      solicitud?.numero_cidc_anterior ||
      wizardSummary?.numeroCIDCAnterior ||
      null,
    motivo:
      solicitud?.motivo_detalle ||
      wizardSummary?.motivoDetalle ||
      null
  }), [solicitud, wizardSummary])

  const formatDate = useCallback((value) => {
    if (!value) return 'No disponible'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? 'No disponible'
      : parsed.toLocaleDateString('es-DO')
  }, [])

  const formatDateTime = useCallback((value) => {
    if (!value) return 'No disponible'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? 'No disponible'
      : parsed.toLocaleString('es-DO', {
          dateStyle: 'short',
          timeStyle: 'short'
        })
  }, [])

  const puedeVerDetalleInterno = currentUser?.tipo_usuario === 'EMPLEADO'

  const resolveDocSummaryLabel = useCallback((doc) => {
    if (doc.adjuntado) return 'Adjuntado'
    if (doc.requerido) return 'Pendiente'
    return 'Opcional'
  }, [])

  const resolveArchivoEstadoClass = useCallback((estado) => {
    if (estado === 'CUMPLE') return 'bg-green-100 text-green-800'
    if (estado === 'NO_CUMPLE') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }, [])

  const resolveArchivoEstadoLabel = useCallback((estado) => {
    if (!estado) return 'PENDIENTE'
    if (estado === 'PENDIENTE_REVISION') return 'PENDIENTE'
    if (estado === 'PENDIENTE') return 'PENDIENTE'
    return estado.replaceAll('_', ' ')
  }, [])

  const renderCertificadoInfo = () => {
    if (certificadoLoading) {
      return <p className="text-sm text-green-700 mt-2">Buscando certificado...</p>
    }
    if (certificado) {
      return (
        <ul className="text-sm text-green-900 mt-3 space-y-1">
          <li><span className="font-semibold">Núm. resolución:</span> {certificado.num_resolucion || certificado.numero_certificado || 'Pendiente'}</li>
          <li><span className="font-semibold">Fecha de emisión:</span> {certificado.fecha_emision ? formatDateTime(certificado.fecha_emision) : 'Pendiente'}</li>
          <li><span className="font-semibold">Estado:</span> {certificado.estado || certificado.estado_certificado || 'ACTIVO'}</li>
        </ul>
      )
    }
    return (
      <p className="text-sm text-green-800 mt-3">
        Estamos finalizando la publicación del certificado. Intenta nuevamente en unos minutos.
      </p>
    )
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
        <p className="text-center text-gray-600">Solicitud no encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {(justCreated || justResubmitted) && (
        <div className="card mb-6 border border-green-200 bg-green-50">
          <h2 className="text-2xl font-bold text-green-900">
            {justResubmitted ? 'Correcciones enviadas' : 'Solicitud creada exitosamente'}
          </h2>
          <p className="text-green-800 mt-2">
            {justResubmitted
              ? 'Tus actualizaciones fueron enviadas a Ventanilla. Recibirás una notificación cuando vuelvan a revisar tu solicitud.'
              : 'Hemos recibido tu información. Podrás dar seguimiento al progreso desde esta pantalla y recibirás notificaciones cuando necesitemos documentación adicional.'}
          </p>
        </div>
      )}

      {puedeCorregir && (
        <>
          <div className="card mb-6 border border-amber-200 bg-amber-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-amber-900">Solicitud devuelta por Ventanilla</h2>
              <p className="text-amber-800 mt-1">
                Revisa las observaciones recibidas, corrige la información necesaria y vuelve a enviar tu solicitud.
              </p>
            </div>
            <button
              onClick={() => {
                const destinoId = solicitud?.id_solicitud || id
                navigate(`/solicitud/${destinoId}/correcciones`, { state: { fromDetalle: true, solicitudId: destinoId } })
              }}
              className="self-start md:self-auto px-5 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800"
            >
              Corregir y reenviar
            </button>
          </div>

          <div className="card mb-6 border border-amber-100">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary-950">¿Qué necesitas corregir?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Estos son los campos que se solicitaron ajustar antes de volver a enviar tu expediente.
              </p>
            </div>
            {motivoDevolucion && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Motivo general:</p>
                <p>{motivoDevolucion}</p>
              </div>
            )}
            {camposObservados.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {camposObservados.map((campo) => (
                  <li key={campo.id} className="py-3">
                    <p className="font-semibold text-primary-950">{campo.etiqueta}</p>
                    <p className="text-sm text-gray-700 mt-1">{campo.comentario}</p>
                    {campo.fecha && (
                      <p className="text-xs text-gray-500 mt-1">
                        Observado el {formatDateTime(campo.fecha)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">
                No encontramos observaciones específicas. Si tienes dudas, comunícate con Ventanilla antes de reenviar.
              </p>
            )}
          </div>
        </>
      )}

      {/* Encabezado */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary-950">
              {headerInfo.numero}
            </h1>
            <p className="text-gray-600 mt-1">
              {headerInfo.servicio}
            </p>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
            {solicitud.estado_solicitud || 'SIN ESTADO'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Fecha de solicitud</p>
            <p className="font-semibold">{formatDate(solicitud.fecha_creacion)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo de trámite</p>
            <p className="font-semibold">{headerInfo.tramite}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Límite de respuesta</p>
            <p className="font-semibold">{formatDate(solicitud.fecha_vencimiento)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto a pagar</p>
            <p className="font-semibold text-accent-600">
              RD${Number(headerInfo.monto || 0).toLocaleString('es-DO')}
            </p>
          </div>
        </div>
      </div>

      {estaEnDncd && (
        <div className="card mb-6 border border-blue-200 bg-blue-50">
          <h2 className="text-xl font-bold text-primary-950">Tu solicitud está en revisión DNCD</h2>
          <p className="text-primary-900 mt-2 text-sm">
            Dirección ya aprobó tu expediente y lo envió a la DNCD para la revisión de no objeción. Esta fase no requiere ninguna acción adicional de tu parte; te avisaremos por correo cuando finalice.
          </p>
          <ul className="mt-3 text-sm text-primary-900 space-y-1 list-disc list-inside">
            <li>La DNCD valida la información y los documentos remitidos.</li>
            <li>Cuando la no objeción sea emitida, tu certificado aparecerá en esta misma pantalla.</li>
          </ul>
        </div>
      )}

      {debeMostrarCertificado && (
        <div className="card mb-6 border border-green-200 bg-green-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-green-900">Certificado emitido con firmas</h2>
              <p className="text-green-800 mt-1">
                Tu resolución firmada ya está disponible para descarga inmediata y también fue enviada a tu correo registrado.
              </p>
              {renderCertificadoInfo()}
            </div>
            <button
              type="button"
              className="btn-primary self-start"
              onClick={descargarCertificadoFirmado}
              disabled={certificadoLoading || descargandoCertificado}
            >
              {descargandoCertificado ? 'Preparando descarga...' : 'Descargar certificado firmado'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sección principal */}
        <div className="lg:col-span-2 space-y-6">
          {camposResumen.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-primary-950 mb-4">
                Datos enviados en la solicitud
              </h2>
              {(detalleTramiteExtra.numeroCIDC || detalleTramiteExtra.motivo) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  {detalleTramiteExtra.numeroCIDC && (
                    <div>
                      <p className="text-gray-500">Número CIDC/Permiso anterior</p>
                      <p className="font-semibold text-primary-950">{detalleTramiteExtra.numeroCIDC}</p>
                    </div>
                  )}
                  {detalleTramiteExtra.motivo && (
                    <div>
                      <p className="text-gray-500">Motivo detallado</p>
                      <p className="font-semibold text-primary-950">{detalleTramiteExtra.motivo}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {camposResumen.map((item) => (
                  <div key={item.key || item.label} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-gray-600 mr-4">{item.label}</span>
                    <span className="font-semibold text-primary-950 text-right">
                      {item.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documentosResumen.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-primary-950 mb-4">
                Documentos reportados
              </h2>
              <div className="space-y-4">
                {documentosResumen.map((group, groupIndex) => (
                  <div key={`${group.title || 'grupo'}-${groupIndex}`}>
                    <p className="font-semibold text-primary-950 text-sm mb-2">{group.title}</p>
                    <ul className="space-y-1 text-sm">
                      {(group.documents || []).map((doc, docIndex) => (
                        <li key={`${doc.name || doc.label}-${docIndex}`} className="flex justify-between">
                          <span>{doc.label}</span>
                          <span className={doc.adjuntado ? 'text-green-600' : 'text-gray-500'}>
                            {resolveDocSummaryLabel(doc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archivos adjuntos */}
          <div className="card">
            <h2 className="text-xl font-bold text-primary-950 mb-4">
              Documentos Adjuntos
            </h2>

            {archivos.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay documentos adjuntos aún
              </p>
            ) : (
              <div className="space-y-2">
                {archivos.map((archivo) => (
                  <div
                    key={archivo.id_archivo}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-primary-950">
                        {archivo.nombre_archivo}
                      </p>
                      <div className="flex gap-2 text-xs text-gray-600">
                        <span>{archivo.tipo_archivo}</span>
                        <span>•</span>
                        <span>
                          {formatDate(archivo.fecha_visible)}
                        </span>
                        <span className={`px-2 py-1 rounded ${resolveArchivoEstadoClass(archivo.estado_cliente)}`}>
                          {resolveArchivoEstadoLabel(archivo.estado_cliente)}
                        </span>
                      </div>
                    </div>
                    <button className="text-accent-600 hover:text-accent-700">
                      <FiDownload />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sustancias solicitadas */}
          {solicitud.sustancias && solicitud.sustancias.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-primary-950 mb-4">
                Sustancias Solicitadas
              </h2>
              <div className="space-y-3">
                {solicitud.sustancias.map((sustancia) => (
                  <div key={sustancia.id_solicitud_sustancia} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-primary-950">
                      {sustancia.nombre_sustancia}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                      <span>Código: {sustancia.codigo_sustancia}</span>
                      <span>Categoría: {sustancia.id_categoria}</span>
                      {sustancia.cantidad_medicamento && (
                        <span>Cantidad: {sustancia.cantidad_medicamento}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Barra lateral - Timeline */}
        <div className="card h-fit">
          <h2 className="text-xl font-bold text-primary-950 mb-4">
            Historial
          </h2>

          {historial.length === 0 ? (
            <p className="text-gray-600 text-sm">
              Sin cambios registrados aún
            </p>
          ) : (
            <div className="space-y-4">
              {historial.map((evento, idx) => (
                <div key={evento.id_historial} className="relative">
                  {idx < historial.length - 1 && (
                    <div className="absolute left-4 top-8 w-1 h-6 bg-accent-600"></div>
                  )}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-600 flex-shrink-0 flex items-center justify-center">
                      <FiChevronRight className="text-white" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-primary-950 text-sm">
                        {evento.estado_nuevo || evento.estado_destino || 'Actualización'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateTime(evento.fecha_cambio)}
                      </p>
                      {puedeVerDetalleInterno && (evento.empleado_nombre || evento.empleado_rol) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Atendido por {evento.empleado_nombre || 'Personal interno'}
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
  )
}

export default DetalleSolicitud
