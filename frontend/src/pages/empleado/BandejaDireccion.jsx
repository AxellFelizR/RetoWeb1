import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiEye } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { solicitudAPI } from '../../services/api'

const BandejaDireccion = () => {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await solicitudAPI.obtenerPorEstado('EN_DIRECCION', pagina, 20)
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setSolicitudes(data)
    } catch (error) {
      toast.error(error?.message || 'Error al cargar solicitudes para Dirección')
    } finally {
      setLoading(false)
    }
  }, [pagina])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  const renderFecha = (solicitud) => {
    const fecha = solicitud.fecha_actualizacion || solicitud.fecha_creacion
    if (!fecha) return 'Sin fecha'
    return new Date(fecha).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-950">Bandeja de Dirección</h1>
        <p className="text-gray-600 mt-2">
          Expedientes aprobados por el encargado UPC en espera de firma y resolución final.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          {solicitudes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay solicitudes enviadas por el encargado UPC.</p>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-primary-700 text-white">
                  <th>Expediente</th>
                  <th>Solicitante</th>
                  <th>Servicio</th>
                  <th>Estado actual</th>
                  <th>Última actualización</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id_solicitud}>
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
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                        EN_DIRECCION
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{renderFecha(solicitud)}</td>
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
    </div>
  )
}

export default BandejaDireccion
