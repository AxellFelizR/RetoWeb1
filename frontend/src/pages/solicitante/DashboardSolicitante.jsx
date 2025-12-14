import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { solicitudAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { FiPlus, FiEye, FiFilter } from 'react-icons/fi'

const DashboardSolicitante = () => {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODAS')
  const [pagina, setPagina] = useState(1)

  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await solicitudAPI.misSolicitudes(pagina, 10)
      setSolicitudes(response.data || [])
    } catch (error) {
      toast.error('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [pagina])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  const getEstadoColor = (estado) => {
    const colores = {
      'CREADA': 'bg-gray-100 text-gray-800',
      'EN_VENTANILLA': 'bg-blue-100 text-blue-800',
      'EN_ENCARGADO_UPC': 'bg-purple-100 text-purple-800',
      'EN_UPC': 'bg-purple-100 text-purple-800',
      'EN_DIRECCION': 'bg-orange-100 text-orange-800',
      'EN_DNCD': 'bg-yellow-100 text-yellow-800',
      'APROBADA': 'bg-green-100 text-green-800',
      'RECHAZADA': 'bg-red-100 text-red-800',
      'CERTIFICADO_EMITIDO': 'bg-green-100 text-green-800'
    }
    return colores[estado] || 'bg-gray-100 text-gray-800'
  }

  const formatFecha = (valor) => {
    if (!valor) return 'Sin fecha'
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime())
      ? 'Sin fecha'
      : fecha.toLocaleDateString('es-DO')
  }

  const resolveNumeroSolicitud = (solicitud) =>
    solicitud.numero_solicitud || solicitud.numero_expediente || `SOL-${solicitud.id_solicitud}`

  const resolveNombreServicio = (solicitud) =>
    solicitud.nombre_servicio || solicitud.nombre_tramite || `Servicio #${solicitud.id_tipo_servicio}`

  const resolveEstado = (solicitud) =>
    (solicitud.estado_actual || solicitud.estado_solicitud || 'SIN_ESTADO').toUpperCase()

  const ESTADOS_COMPLETADOS = useMemo(
    () => new Set(['APROBADA', 'RECHAZADA', 'DENEGADA', 'CERTIFICADO_EMITIDO', 'COMPLETADA']),
    []
  )

  const solicitudesFiltradas = useMemo(() => {
    if (filtro === 'COMPLETADAS') {
      return solicitudes.filter((solicitud) => ESTADOS_COMPLETADOS.has(resolveEstado(solicitud)))
    }
    if (filtro === 'ACTIVAS') {
      return solicitudes.filter((solicitud) => !ESTADOS_COMPLETADOS.has(resolveEstado(solicitud)))
    }
    return solicitudes
  }, [filtro, solicitudes, ESTADOS_COMPLETADOS])

  const mensajeVacio = useMemo(() => {
    if (filtro === 'ACTIVAS') return 'No tienes solicitudes activas ahora mismo'
    if (filtro === 'COMPLETADAS') return 'Aún no has completado ninguna solicitud'
    return 'No tienes solicitudes aún'
  }, [filtro])

  const renderTablaSolicitudes = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
        </div>
      )
    }

    if (solicitudesFiltradas.length === 0) {
      return (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">{mensajeVacio}</p>
          <Link
            to="/crear-solicitud"
            className="text-accent-600 font-semibold hover:underline"
          >
            Crear mi primera solicitud →
          </Link>
        </div>
      )
    }

    return (
      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-primary-700 text-white">
              <th>Solicitud</th>
              <th>Tipo de Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesFiltradas.map((solicitud) => (
              <tr key={solicitud.id_solicitud}>
                <td className="font-semibold text-primary-950">
                  {resolveNumeroSolicitud(solicitud)}
                </td>
                <td className="text-sm text-gray-700">
                  {resolveNombreServicio(solicitud)}
                </td>
                <td className="text-sm">
                  {formatFecha(solicitud.fecha_solicitud || solicitud.fecha_creacion)}
                </td>
                <td>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(resolveEstado(solicitud))}`}>
                    {resolveEstado(solicitud)}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/solicitud/${solicitud.id_solicitud}`}
                    className="flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold"
                  >
                    <FiEye /> Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">
            Mis Solicitudes
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus solicitudes de sustancias controladas
          </p>
        </div>
        <Link
          to="/crear-solicitud"
          className="flex items-center gap-2 bg-primary-950 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          <FiPlus /> Nueva Solicitud
        </Link>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex gap-4 items-center">
        <FiFilter className="text-primary-700" />
        <button
          onClick={() => { setFiltro('TODAS'); setPagina(1) }}
          className={`px-4 py-2 rounded ${
            filtro === 'TODAS'
              ? 'bg-primary-950 text-white'
              : 'bg-gray-200 text-primary-950'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => { setFiltro('ACTIVAS'); setPagina(1) }}
          className={`px-4 py-2 rounded ${
            filtro === 'ACTIVAS'
              ? 'bg-primary-950 text-white'
              : 'bg-gray-200 text-primary-950'
          }`}
        >
          Activas
        </button>
        <button
          onClick={() => { setFiltro('COMPLETADAS'); setPagina(1) }}
          className={`px-4 py-2 rounded ${
            filtro === 'COMPLETADAS'
              ? 'bg-primary-950 text-white'
              : 'bg-gray-200 text-primary-950'
          }`}
        >
          Completadas
        </button>
      </div>

      {/* Tabla de solicitudes */}
      {renderTablaSolicitudes()}
    </div>
  )
}

export default DashboardSolicitante
