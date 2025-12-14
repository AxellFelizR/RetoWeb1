import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiFilter } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { solicitudAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const TABS_TECNICO = [
  { id: 'VALIDADA', etiqueta: 'Pendientes (validada)', estado: 'VALIDADA' },
  { id: 'EN_UPC', etiqueta: 'En revisión', estado: 'EN_UPC' },
  { id: 'DEVUELTA_UPC', etiqueta: 'Devueltas/observadas', estado: 'DEVUELTA_UPC' }
]

const TABS_ENCARGADO = [
  { id: 'EN_REVISION_UPC', etiqueta: 'Pendientes por abrir', estado: 'EN_REVISION_UPC' },
  { id: 'EN_ENCARGADO_UPC', etiqueta: 'En revisión del encargado', estado: 'EN_ENCARGADO_UPC' },
  { id: 'EN_DIRECCION', etiqueta: 'Enviadas a Dirección', estado: 'EN_DIRECCION' },
  { id: 'DENEGADA', etiqueta: 'Denegadas', estado: 'DENEGADA' }
]

const BandejaUPC = () => {
  const { user } = useAuthStore()
  const rol = user?.rol
  const esTecnico = rol === 'TECNICO_UPC'
  const esEncargado = rol === 'ENCARGADO_UPC'

  const tabs = useMemo(() => (esEncargado ? TABS_ENCARGADO : TABS_TECNICO), [esEncargado])
  const estadoInicial = tabs[0]?.estado || 'VALIDADA'

  const [estadoActivo, setEstadoActivo] = useState(estadoInicial)
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarSolicitudes = useCallback(async () => {
    if (!esTecnico && !esEncargado) {
      setSolicitudes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await solicitudAPI.obtenerPorEstado(estadoActivo, 1, 50)
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setSolicitudes(data)
    } catch (error) {
      toast.error(error?.message || 'No se pudo cargar la bandeja UPC')
    } finally {
      setLoading(false)
    }
  }, [estadoActivo, esTecnico, esEncargado])

  useEffect(() => {
    setEstadoActivo(estadoInicial)
  }, [estadoInicial])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  if (!esTecnico && !esEncargado) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-primary-950">Sin acceso a UPC</h1>
        <p className="text-gray-600 mt-2">
          Debes tener rol técnico o encargado UPC para ver esta bandeja.
        </p>
      </div>
    )
  }

  const titulo = esEncargado ? 'Bandeja Encargado UPC' : 'Bandeja Técnico UPC'
  const descripcion = esEncargado
    ? 'Visto bueno y autorización para enviar a Dirección'
    : 'Evaluación técnica exhaustiva de expedientes validados'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-primary-950">{titulo}</h1>
        <p className="text-gray-600 mt-2">{descripcion}</p>
      </header>

      <section className="card flex items-center gap-3 flex-wrap">
        <FiFilter className="text-primary-700" />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setEstadoActivo(tab.estado)}
            className={`px-4 py-2 rounded transition text-sm font-semibold ${
              estadoActivo === tab.estado
                ? 'bg-primary-950 text-white'
                : 'bg-gray-200 text-primary-950 hover:bg-gray-300'
            }`}
          >
            {tab.etiqueta}
          </button>
        ))}
      </section>

      <section className="card overflow-x-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950" />
          </div>
        )}

        {!loading && solicitudes.length === 0 && (
          <p className="text-center text-gray-600 py-10">
            No hay solicitudes para este estado actualmente.
          </p>
        )}

        {!loading && solicitudes.length > 0 && (
          <table className="table w-full text-sm">
            <thead>
              <tr className="bg-primary-900 text-white">
                <th>Expediente</th>
                <th>Solicitante</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id_solicitud}>
                  <td className="font-semibold text-primary-950">
                    {solicitud.numero_solicitud || solicitud.numero_expediente || `SOL-${solicitud.id_solicitud}`}
                  </td>
                  <td>
                    <p className="font-semibold text-primary-950">{solicitud.nombre_solicitante || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{solicitud.email_solicitante || 'Sin correo'}</p>
                  </td>
                  <td>
                    <p>{solicitud.nombre_servicio || 'Servicio no disponible'}</p>
                    <p className="text-xs text-gray-500">{solicitud.nombre_tramite || ''}</p>
                  </td>
                  <td>
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {solicitud.estado_actual || solicitud.estado_solicitud}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const fecha = solicitud.fecha_actualizacion || solicitud.ultimo_cambio_fecha
                      if (!fecha) return 'Sin registro'
                      return new Date(fecha).toLocaleString('es-DO')
                    })()}
                  </td>
                  <td>
                    <Link
                      to={`/revisar/${solicitud.id_solicitud}`}
                      className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold"
                    >
                      <FiEye /> Ver expediente
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default BandejaUPC
