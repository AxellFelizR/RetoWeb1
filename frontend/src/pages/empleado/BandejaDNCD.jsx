import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiChevronRight, FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { solicitudAPI } from '../../services/api'

const BandejaDNCD = () => {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [solicitudesEntregadas, setSolicitudesEntregadas] = useState([])
  const [loadingEntregadas, setLoadingEntregadas] = useState(true)
  const [paginaEntregadas, setPaginaEntregadas] = useState(1)
  const [historiales, setHistoriales] = useState({})
  const [historialActivo, setHistorialActivo] = useState(null)

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await solicitudAPI.obtenerPorEstado('EN_DNCD', pagina, 20)
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setSolicitudes(data)
    } catch (error) {
      toast.error(error?.message || 'No se pudieron cargar las solicitudes para DNCD')
    } finally {
      setLoading(false)
    }
  }, [pagina])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  const cargarEntregadas = useCallback(async () => {
    try {
      setLoadingEntregadas(true)
      const response = await solicitudAPI.obtenerPorEstado('CERTIFICADO_EMITIDO', paginaEntregadas, 20)
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setSolicitudesEntregadas(data)
    } catch (error) {
      toast.error(error?.message || 'No se pudieron cargar las solicitudes entregadas')
    } finally {
      setLoadingEntregadas(false)
    }
  }, [paginaEntregadas])

  useEffect(() => {
    cargarEntregadas()
  }, [cargarEntregadas])

  const renderFecha = (solicitud, fechaPersonalizada = null) => {
    const fecha = fechaPersonalizada || solicitud.fecha_actualizacion || solicitud.fecha_creacion
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })
  }

  const toggleHistorial = useCallback(async (solicitudId) => {
    if (historialActivo === solicitudId) {
      setHistorialActivo(null)
      return
    }

    if (!historiales[solicitudId]) {
      setHistoriales((prev) => ({
        ...prev,
        [solicitudId]: { loading: true, data: [] }
      }))
      setHistorialActivo(solicitudId)
      try {
        const detalle = await solicitudAPI.obtener(solicitudId)
        const eventos = detalle.data?.historial || []
        setHistoriales((prev) => ({
          ...prev,
          [solicitudId]: { loading: false, data: eventos }
        }))
      } catch (error) {
        toast.error(error?.message || 'No se pudo cargar el historial de la solicitud')
        setHistoriales((prev) => ({
          ...prev,
          [solicitudId]: { loading: false, data: [] }
        }))
      }
      return
    }

    setHistorialActivo(solicitudId)
  }, [historialActivo, historiales])

  const formatEstado = (estado) => (estado || 'SIN ESTADO').replace(/_/g, ' ')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-950">Bandeja DNCD</h1>
        <p className="text-gray-600 mt-2">
          Revisión de no objeción y envío final al solicitante.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {solicitudes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay solicitudes en revisión DNCD.</p>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-primary-700 text-white">
                  <th>Expediente</th>
                  <th>Solicitante</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Última actualización</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => {
                  const isExpanded = historialActivo === solicitud.id_solicitud
                  const historial = historiales[solicitud.id_solicitud]

                  return (
                    <Fragment key={solicitud.id_solicitud}>
                      <tr>
                        <td className="font-semibold text-primary-950">
                          {solicitud.numero_expediente || solicitud.numero_solicitud}
                        </td>
                        <td>
                          <p className="font-semibold text-primary-950">{solicitud.nombre_solicitante || 'Sin nombre'}</p>
                          <p className="text-xs text-gray-600">{solicitud.email_solicitante || 'Sin email'}</p>
                        </td>
                        <td className="text-sm">
                          <p>{solicitud.nombre_servicio || 'Servicio no definido'}</p>
                          <p className="text-xs text-gray-500">{solicitud.nombre_tramite || ''}</p>
                        </td>
                        <td>
                          <span className="inline-flex text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800 uppercase">
                            {formatEstado(solicitud.estado_solicitud)}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600">{renderFecha(solicitud)}</td>
                        <td>
                          <div className="flex flex-col gap-2 text-sm">
                            <Link
                              to={`/revisar/${solicitud.id_solicitud}`}
                              className="flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold"
                            >
                              <FiEye /> Revisar PDF
                            </Link>
                            <button
                              type="button"
                              className="text-primary-950 hover:text-primary-700 font-semibold"
                              onClick={() => toggleHistorial(solicitud.id_solicitud)}
                            >
                              {isExpanded ? 'Ocultar historial' : 'Ver historial'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6}>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-primary-950">Historial reciente</h4>
                                {historial?.loading && (
                                  <span className="text-xs text-gray-500">Cargando...</span>
                                )}
                              </div>
                              {!historial || historial.loading ? (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-700"></div>
                                  <span>Obteniendo historial...</span>
                                </div>
                              ) : historial.data.length === 0 ? (
                                <p className="text-sm text-gray-600">Sin movimientos registrados.</p>
                              ) : (
                                <div className="space-y-4">
                                  {historial.data.map((evento, idx) => (
                                    <div key={evento.id_historial || idx} className="relative">
                                      {idx < historial.data.length - 1 && (
                                        <div className="absolute left-4 top-8 w-1 h-6 bg-accent-600"></div>
                                      )}
                                      <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-accent-600 flex-shrink-0 flex items-center justify-center">
                                          <FiChevronRight className="text-white" size={14} />
                                        </div>
                                        <div className="flex-1 text-sm">
                                          <p className="font-semibold text-primary-950">
                                            {evento.estado_nuevo || evento.estado_destino || 'Actualización'}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {evento.fecha_cambio ? new Date(evento.fecha_cambio).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin fecha'}
                                          </p>
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
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          className="btn-secondary"
          disabled={pagina === 1}
          onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
        >
          Página anterior
        </button>
        <button
          className="btn-primary"
          onClick={() => setPagina((prev) => prev + 1)}
        >
          Página siguiente
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-950">Solicitudes entregadas</h2>
          <p className="text-gray-600">Resumen de expedientes enviados al solicitante tras la no objeción.</p>
        </div>

        {loadingEntregadas ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-950"></div>
          </div>
        ) : solicitudesEntregadas.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Aún no has entregado solicitudes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th>Expediente</th>
                  <th>Solicitante</th>
                  <th>Servicio</th>
                  <th>Certificado</th>
                  <th>Fecha entrega</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {solicitudesEntregadas.map((solicitud) => (
                  <tr key={`entregada-${solicitud.id_solicitud}`}>
                    <td className="font-semibold text-primary-950">
                      {solicitud.numero_expediente || solicitud.numero_solicitud}
                    </td>
                    <td>
                      <p className="font-semibold text-primary-950">{solicitud.nombre_solicitante || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-600">{solicitud.email_solicitante || 'Sin email'}</p>
                    </td>
                    <td className="text-sm">
                      <p>{solicitud.nombre_servicio || 'Servicio no definido'}</p>
                      <p className="text-xs text-gray-500">{solicitud.nombre_tramite || ''}</p>
                    </td>
                    <td className="text-sm text-gray-700">
                      {solicitud.numero_certificado || solicitud.num_resolucion || 'Pendiente'}
                    </td>
                    <td className="text-sm text-gray-600">
                      {renderFecha(solicitud, solicitud.fecha_entrega || solicitud.fecha_actualizacion)}
                    </td>
                    <td>
                      <Link
                        to={`/revisar/${solicitud.id_solicitud}`}
                        className="text-accent-600 hover:text-accent-700 font-semibold"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            disabled={paginaEntregadas === 1}
            onClick={() => setPaginaEntregadas((prev) => Math.max(1, prev - 1))}
          >
            Página anterior
          </button>
          <button
            className="btn-primary"
            onClick={() => setPaginaEntregadas((prev) => prev + 1)}
          >
            Página siguiente
          </button>
        </div>
      </div>
    </div>
  )
}

export default BandejaDNCD
