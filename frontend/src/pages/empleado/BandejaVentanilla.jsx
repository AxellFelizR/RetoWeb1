import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitudAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { FiEye, FiFilter } from 'react-icons/fi'

const FILTROS_ESTADOS = [
  { valor: 'REGISTRADA', etiqueta: 'Registradas', estadoApi: 'CREADA' },
  { valor: 'EN_VENTANILLA', etiqueta: 'En revisión', estadoApi: 'EN_VENTANILLA' },
  { valor: 'DEVUELTA_VENTANILLA', etiqueta: 'Devueltas', estadoApi: 'DEVUELTA_VENTANILLA' }
]

const BandejaVentanilla = () => {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState('REGISTRADA')
  const [pagina, setPagina] = useState(1)

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true)
      const estadoApi = FILTROS_ESTADOS.find((f) => f.valor === estado)?.estadoApi || estado
      const response = await solicitudAPI.obtenerPorEstado(estadoApi, pagina, 20)
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setSolicitudes(data)
    } catch (error) {
      toast.error(error?.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [estado, pagina])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  const resolvePrioridad = (valor) => {
    const prioridad = (valor || 'NORMAL').toUpperCase()
    if (prioridad === 'URGENTE' || prioridad === 'ALTA') {
      return { label: prioridad, className: 'bg-red-100 text-red-800' }
    }
    if (prioridad === 'BAJA') {
      return { label: 'BAJA', className: 'bg-green-100 text-green-800' }
    }
    return { label: 'NORMAL', className: 'bg-yellow-100 text-yellow-800' }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-950">
          Bandeja de Ventanilla Única
        </h1>
        <p className="text-gray-600 mt-2">
          Recepción y validación de solicitudes
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex gap-2 items-center flex-wrap">
        <FiFilter className="text-primary-700" />
        {FILTROS_ESTADOS.map((e) => (
          <button
            key={e.valor}
            onClick={() => { setEstado(e.valor); setPagina(1) }}
            className={`px-4 py-2 rounded transition ${
              estado === e.valor
                ? 'bg-primary-950 text-white'
                : 'bg-gray-200 text-primary-950 hover:bg-gray-300'
            }`}
          >
            {e.etiqueta}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {solicitudes.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No hay solicitudes en este estado
            </p>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-primary-700 text-white">
                  <th>Solicitud</th>
                  <th>Solicitante</th>
                  <th>Tipo de Servicio</th>
                  <th>Fecha</th>
                  <th>Prioridad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id_solicitud}>
                    <td className="font-semibold text-primary-950">
                      {solicitud.numero_solicitud || solicitud.numero_expediente}
                    </td>
                    <td className="text-sm">
                      <p className="font-semibold text-primary-950">
                        {solicitud.nombre_solicitante || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-gray-600">{solicitud.email_solicitante || 'Sin correo'}</p>
                    </td>
                    <td className="text-sm">
                      <p>{solicitud.nombre_servicio || 'Servicio no definido'}</p>
                      <p className="text-xs text-gray-500">{solicitud.nombre_tramite || ''}</p>
                    </td>
                    <td className="text-sm">
                      {(() => {
                        const fechaReferencia = solicitud.fecha_solicitud || solicitud.fecha_creacion
                        if (!fechaReferencia) return 'Sin fecha'
                        return new Date(fechaReferencia).toLocaleDateString('es-DO')
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const prioridad = resolvePrioridad(solicitud.prioridad)
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${prioridad.className}`}>
                            {prioridad.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td>
                      <Link
                        to={`/revisar/${solicitud.id_solicitud}`}
                        className="flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold"
                      >
                        <FiEye /> Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default BandejaVentanilla
