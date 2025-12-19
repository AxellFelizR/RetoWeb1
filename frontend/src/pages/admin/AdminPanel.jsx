import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminAPI, empleadoAPI, servicioAPI, solicitudAPI } from '../../services/api'
import { FiEye, FiLayers, FiPlusCircle, FiRefreshCw, FiTrash2, FiUserPlus } from 'react-icons/fi'
import { keepDigitsOnly, keepDecimalNumber, preventNonDigitKey, preventNonDecimalKey } from '../../utils/numericInput'

const ROLES_DISPONIBLES = ['VENTANILLA', 'TECNICO_UPC', 'ENCARGADO_UPC', 'DIRECCION', 'DNCD', 'ADMIN']
const DEPARTAMENTOS_DISPONIBLES = [
  'VENTANILLA UNICA',
  'UPC',
  'DIR. SUSTANCIAS CONTROLADAS',
  'DNCD',
  'ADMINISTRACION'
]
const ESTADOS_EMPLEADO = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO']
const ESTADOS_SOLICITUD = [
  'TODAS',
  'CREADA',
  'REGISTRADA',
  'EN_VENTANILLA',
  'DEVUELTA_VENTANILLA',
  'VALIDADA',
  'EN_REVISION_UPC',
  'EN_ENCARGADO_UPC',
  'EN_UPC',
  'DEVUELTA_UPC',
  'EN_DIRECCION',
  'DEVUELTA_DIRECCION',
  'EN_DNCD',
  'DEVUELTA_DNCD',
  'PENDIENTE_PAGO',
  'PAGO_CONFIRMADO',
  'APROBADA',
  'RECHAZADA',
  'RESOLUCION_EMITIDA',
  'CERTIFICADO_EMITIDO',
  'COMPLETADA',
  'DENEGADA'
]
const ESTADOS_ACCIONABLES = ESTADOS_SOLICITUD.filter((estado) => estado !== 'TODAS')
const POR_PAGINA = 20

const AdminPanel = () => {
  const [empleados, setEmpleados] = useState([])
  const [empleadosLoading, setEmpleadosLoading] = useState(true)
  const [empleadoActualizando, setEmpleadoActualizando] = useState(null)
  const [empleadoEliminando, setEmpleadoEliminando] = useState(null)
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null)
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre_completo: '',
    email: '',
    cedula: '',
    departamento: DEPARTAMENTOS_DISPONIBLES[0],
    rol: 'VENTANILLA'
  })
  const [creandoEmpleado, setCreandoEmpleado] = useState(false)

  const [servicios, setServicios] = useState([])
  const [serviciosLoading, setServiciosLoading] = useState(true)
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre_servicio: '',
    descripcion: '',
    dias_respuesta: 30,
    requiere_costo_administrativo: true,
    costo_administrativo: 0
  })
  const [creandoServicio, setCreandoServicio] = useState(false)

  const [auditoria, setAuditoria] = useState([])
  const [auditoriaLoading, setAuditoriaLoading] = useState(true)
  const [estadoFiltro, setEstadoFiltro] = useState('TODAS')
  const [paginaAuditoria, setPaginaAuditoria] = useState(1)
  const [estadoEdiciones, setEstadoEdiciones] = useState({})
  const [solicitudActualizando, setSolicitudActualizando] = useState(null)

  const resumenEmpleados = useMemo(() => ({
    total: empleados.length,
    activos: empleados.filter((emp) => emp.estado_empleado === 'ACTIVO').length,
    administradores: empleados.filter((emp) => emp.rol === 'ADMIN').length
  }), [empleados])

  const formatDateTime = (valor) => {
    if (!valor) return 'Sin registro'
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return 'Sin registro'
    return fecha.toLocaleString('es-DO', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  const estadoBadgeClass = (estado) => {
    const map = {
      APROBADA: 'bg-green-100 text-green-800',
      VALIDADA: 'bg-blue-100 text-blue-800',
      RECHAZADA: 'bg-red-100 text-red-800',
      EN_REVISION_UPC: 'bg-purple-100 text-purple-800',
      EN_ENCARGADO_UPC: 'bg-purple-100 text-purple-800',
      RESOLUCION_EMITIDA: 'bg-emerald-100 text-emerald-800'
    }
    return map[estado] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (valor = 0) => {
    try {
      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2
      }).format(Number(valor) || 0)
    } catch (error) {
      return `RD$${Number(valor || 0).toFixed(2)}`
    }
  }

  const estadoServicioBadgeClass = (estado) => {
    if (estado === 'ACTIVO') return 'bg-green-100 text-green-700'
    if (estado === 'INACTIVO') return 'bg-gray-200 text-gray-700'
    return 'bg-amber-100 text-amber-700'
  }

  const fetchEmpleados = useCallback(async () => {
    try {
      setEmpleadosLoading(true)
      const response = await empleadoAPI.listar()
      setEmpleados(response.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo cargar el personal interno')
    } finally {
      setEmpleadosLoading(false)
    }
  }, [])

  const fetchServicios = useCallback(async () => {
    try {
      setServiciosLoading(true)
      const response = await servicioAPI.listar({ includeInactivos: true })
      setServicios(response.data || [])
    } catch (error) {
      const mensaje = typeof error === 'string' ? error : error?.message
      toast.error(mensaje || 'No se pudo cargar el catálogo de servicios')
    } finally {
      setServiciosLoading(false)
    }
  }, [])

  const fetchAuditoria = useCallback(async () => {
    try {
      setAuditoriaLoading(true)
      const response = await adminAPI.solicitudesAuditoria({
        estado: estadoFiltro === 'TODAS' ? undefined : estadoFiltro,
        pagina: paginaAuditoria,
        porPagina: POR_PAGINA
      })
      setAuditoria(response.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo cargar el historial de solicitudes')
    } finally {
      setAuditoriaLoading(false)
    }
  }, [estadoFiltro, paginaAuditoria])

  useEffect(() => {
    fetchEmpleados()
  }, [fetchEmpleados])

  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  useEffect(() => {
    fetchAuditoria()
  }, [fetchAuditoria])

  const handleNuevoEmpleadoChange = (campo, valor) => {
    const sanitizedValue = campo === 'cedula' ? keepDigitsOnly(valor) : valor
    setNuevoEmpleado((prev) => ({
      ...prev,
      [campo]: sanitizedValue
    }))
  }

  const handleNuevoServicioChange = (campo, valor) => {
    let sanitizedValue = valor
    if (campo === 'dias_respuesta') {
      sanitizedValue = keepDigitsOnly(valor)
    } else if (campo === 'costo_administrativo') {
      sanitizedValue = keepDecimalNumber(valor)
    }
    setNuevoServicio((prev) => ({
      ...prev,
      [campo]: sanitizedValue
    }))
  }

  const handleCrearEmpleado = async (e) => {
    e.preventDefault()
    try {
      setCreandoEmpleado(true)
      await empleadoAPI.crear({
        nombre_completo: nuevoEmpleado.nombre_completo,
        email: nuevoEmpleado.email,
        cedula_identidad: nuevoEmpleado.cedula,
        departamento: nuevoEmpleado.departamento,
        rol: nuevoEmpleado.rol
      })
      toast.success('Cuenta creada exitosamente')
      setNuevoEmpleado({ nombre_completo: '', email: '', cedula: '', departamento: DEPARTAMENTOS_DISPONIBLES[0], rol: 'VENTANILLA' })
      fetchEmpleados()
    } catch (error) {
      toast.error(error?.message || 'No se pudo crear la cuenta')
    } finally {
      setCreandoEmpleado(false)
    }
  }

  const handleCrearServicio = async (e) => {
    e.preventDefault()
    if (!nuevoServicio.nombre_servicio.trim()) {
      toast.error('El nombre del servicio es obligatorio')
      return
    }

    try {
      setCreandoServicio(true)
      await servicioAPI.crear({
        nombre_servicio: nuevoServicio.nombre_servicio,
        descripcion: nuevoServicio.descripcion,
        dias_respuesta: Number(nuevoServicio.dias_respuesta) || 0,
        requiere_costo_administrativo: Boolean(nuevoServicio.requiere_costo_administrativo),
        costo_administrativo: Boolean(nuevoServicio.requiere_costo_administrativo)
          ? Number(nuevoServicio.costo_administrativo) || 0
          : 0
      })
      toast.success('Servicio registrado exitosamente')
      setNuevoServicio({
        nombre_servicio: '',
        descripcion: '',
        dias_respuesta: 30,
        requiere_costo_administrativo: true,
        costo_administrativo: 0
      })
      fetchServicios()
    } catch (error) {
      const mensaje = typeof error === 'string' ? error : error?.message
      toast.error(mensaje || 'No se pudo crear el servicio')
    } finally {
      setCreandoServicio(false)
    }
  }

  const actualizarEmpleado = async (idEmpleado, payload) => {
    try {
      setEmpleadoActualizando(idEmpleado)
      await empleadoAPI.actualizar(idEmpleado, payload)
      setEmpleados((prev) => prev.map((emp) => (
        emp.id_empleado === idEmpleado ? { ...emp, ...payload } : emp
      )))
      toast.success('Cambios guardados')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo actualizar al empleado')
      fetchEmpleados()
    } finally {
      setEmpleadoActualizando(null)
    }
  }

  const eliminarEmpleado = async () => {
    if (!confirmacionEliminar) {
      return
    }

    try {
      setEmpleadoEliminando(confirmacionEliminar.id_empleado)
      await empleadoAPI.eliminar(confirmacionEliminar.id_empleado)
      setEmpleados((prev) => prev.filter((emp) => emp.id_empleado !== confirmacionEliminar.id_empleado))
      toast.success('Empleado eliminado exitosamente')
      setConfirmacionEliminar(null)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'No se pudo eliminar al empleado')
    } finally {
      setEmpleadoEliminando(null)
    }
  }

  const canGoNext = auditoria.length === POR_PAGINA

  const manejarSeleccionEstado = (idSolicitud, valor) => {
    setEstadoEdiciones((prev) => ({
      ...prev,
      [idSolicitud]: valor
    }))
  }

  const manejarCambioEstadoSolicitud = async (solicitud) => {
    const idSolicitud = solicitud.id_solicitud
    const nuevoEstado = estadoEdiciones[idSolicitud]

    if (!nuevoEstado) {
      toast.error('Selecciona un estado de destino')
      return
    }

    try {
      setSolicitudActualizando(idSolicitud)
      await solicitudAPI.cambiarEstado(idSolicitud, nuevoEstado, 'Cambio manual desde panel de administración')
      toast.success('Estado actualizado')
      setEstadoEdiciones((prev) => ({ ...prev, [idSolicitud]: '' }))
      fetchAuditoria()
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'No se pudo actualizar la solicitud')
    } finally {
      setSolicitudActualizando(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-primary-950">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Control total de usuarios internos y auditoría de solicitudes.</p>
      </header>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Personal registrado</p>
          <p className="text-3xl font-bold text-primary-950">{resumenEmpleados.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-3xl font-bold text-green-700">{resumenEmpleados.activos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Cuentas ADMIN</p>
          <p className="text-3xl font-bold text-amber-600">{resumenEmpleados.administradores}</p>
        </div>
      </div>

      {/* Gestión de usuarios */}
      <section className="card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary-950">Gestión de usuarios internos</h2>
            <p className="text-gray-600 text-sm">Modifica roles o estados de las cuentas existentes.</p>
          </div>
          <button
            type="button"
            onClick={fetchEmpleados}
            className="flex items-center gap-2 text-sm font-semibold text-primary-950 hover:text-primary-700"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Nombre</th>
                <th className="py-2">Email</th>
                <th className="py-2">Departamento</th>
                <th className="py-2">Rol</th>
                <th className="py-2">Estado</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleadosLoading && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">Cargando personal...</td>
                </tr>
              )}
              {!empleadosLoading && empleados.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500">No hay empleados registrados aún.</td>
                </tr>
              )}
              {!empleadosLoading && empleados.length > 0 && empleados.map((emp) => (
                <tr key={emp.id_empleado} className="border-b last:border-0">
                  <td className="py-3">
                    <p className="font-semibold text-primary-950">{emp.nombre_completo}</p>
                  </td>
                  <td className="py-3">{emp.email}</td>
                  <td className="py-3">{emp.departamento || 'Sin asignar'}</td>
                  <td className="py-3">
                    <select
                      className="input-field px-2 py-1"
                      value={emp.rol}
                      disabled={empleadoActualizando === emp.id_empleado}
                      onChange={(e) => actualizarEmpleado(emp.id_empleado, { rol: e.target.value })}
                    >
                      {ROLES_DISPONIBLES.map((rol) => (
                        <option key={rol} value={rol}>{rol}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <select
                      className="input-field px-2 py-1"
                      value={emp.estado_empleado}
                      disabled={empleadoActualizando === emp.id_empleado}
                      onChange={(e) => actualizarEmpleado(emp.id_empleado, { estado_empleado: e.target.value })}
                    >
                      {ESTADOS_EMPLEADO.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirmacionEliminar(emp)}
                      disabled={Boolean(empleadoEliminando)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <FiTrash2 />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Crear nuevo usuario */}
      <section className="card">
        <div className="flex items-center gap-2 mb-4">
          <FiUserPlus className="text-primary-950" />
          <h2 className="text-xl font-semibold text-primary-950">Crear nueva cuenta interna</h2>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCrearEmpleado}>
          <div>
            <label className="form-label required" htmlFor="nombreCompleto">Nombre completo</label>
            <input
              id="nombreCompleto"
              className="input-field"
              value={nuevoEmpleado.nombre_completo}
              onChange={(e) => handleNuevoEmpleadoChange('nombre_completo', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label required" htmlFor="emailInstitucional">Email institucional</label>
            <input
              id="emailInstitucional"
              type="email"
              className="input-field"
              value={nuevoEmpleado.email}
              onChange={(e) => handleNuevoEmpleadoChange('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label required" htmlFor="cedulaEmpleado">Cédula</label>
            <input
              id="cedulaEmpleado"
              className="input-field"
              value={nuevoEmpleado.cedula}
              onChange={(e) => handleNuevoEmpleadoChange('cedula', e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={preventNonDigitKey}
              required
            />
          </div>
          <div>
            <label className="form-label required" htmlFor="departamentoEmpleado">Departamento</label>
            <select
              id="departamentoEmpleado"
              className="input-field"
              value={nuevoEmpleado.departamento}
              onChange={(e) => handleNuevoEmpleadoChange('departamento', e.target.value)}
              required
            >
              {DEPARTAMENTOS_DISPONIBLES.map((departamento) => (
                <option key={departamento} value={departamento}>{departamento}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label required" htmlFor="rolEmpleado">Rol</label>
            <select
              id="rolEmpleado"
              className="input-field"
              value={nuevoEmpleado.rol}
              onChange={(e) => handleNuevoEmpleadoChange('rol', e.target.value)}
              required
            >
              {ROLES_DISPONIBLES.map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creandoEmpleado}
              className="bg-primary-950 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
            >
              {creandoEmpleado ? 'Creando...' : 'Registrar usuario'}
            </button>
          </div>
        </form>
      </section>

      {/* Catálogo de servicios */}
      <section className="card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary-50 text-primary-950">
              <FiLayers />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-primary-950">Catálogo de servicios</h2>
              <p className="text-sm text-gray-600">Gestiona los tipos de servicio disponibles para los solicitantes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchServicios}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold text-primary-950"
          >
            <FiRefreshCw /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Servicio</th>
                    <th className="py-2">Días respuesta</th>
                    <th className="py-2">Costo</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosLoading && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">Cargando servicios...</td>
                    </tr>
                  )}
                  {!serviciosLoading && servicios.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">Aún no hay servicios registrados.</td>
                    </tr>
                  )}
                  {!serviciosLoading && servicios.length > 0 && servicios.map((servicio) => (
                    <tr key={servicio.id_tipo_servicio} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-semibold text-primary-950">{servicio.nombre_servicio}</p>
                        <p className="text-xs text-gray-500">{servicio.descripcion || 'Sin descripción'}</p>
                      </td>
                      <td className="py-3">{servicio.dias_respuesta ?? 'S/D'}</td>
                      <td className="py-3">
                        {servicio.requiere_costo_administrativo
                          ? formatCurrency(servicio.costo_administrativo)
                          : 'Exonerado'}
                      </td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoServicioBadgeClass(servicio.estado_servicio)}`}>
                          {servicio.estado_servicio || 'SIN ESTADO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:col-span-2 border rounded-xl p-4 bg-primary-50/50">
            <form className="space-y-3" onSubmit={handleCrearServicio}>
              <div className="flex items-center gap-2 text-primary-950">
                <FiPlusCircle />
                <h3 className="font-semibold">Registrar nuevo servicio</h3>
              </div>
              <div>
                <label className="form-label required" htmlFor="nombreServicio">Nombre</label>
                <input
                  id="nombreServicio"
                  className="input-field"
                  value={nuevoServicio.nombre_servicio}
                  onChange={(e) => handleNuevoServicioChange('nombre_servicio', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="descripcionServicio">Descripción</label>
                <textarea
                  id="descripcionServicio"
                  className="input-field"
                  rows="3"
                  value={nuevoServicio.descripcion}
                  onChange={(e) => handleNuevoServicioChange('descripcion', e.target.value)}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="diasRespuesta">Días respuesta</label>
                  <input
                    id="diasRespuesta"
                    type="number"
                    min="0"
                    max="365"
                    className="input-field"
                    value={nuevoServicio.dias_respuesta}
                    onChange={(e) => handleNuevoServicioChange('dias_respuesta', e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onKeyDown={preventNonDigitKey}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="requiereCosto">Costo administrativo</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="requiereCosto"
                      type="checkbox"
                      checked={Boolean(nuevoServicio.requiere_costo_administrativo)}
                      onChange={(e) => handleNuevoServicioChange('requiere_costo_administrativo', e.target.checked)}
                    />
                    <span className="text-sm text-gray-600">Requiere cobro</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="costoAdministrativo">Monto (RD$)</label>
                <input
                  id="costoAdministrativo"
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={nuevoServicio.costo_administrativo}
                  disabled={!nuevoServicio.requiere_costo_administrativo}
                  onChange={(e) => handleNuevoServicioChange('costo_administrativo', e.target.value)}
                  inputMode="decimal"
                  onKeyDown={preventNonDecimalKey}
                />
              </div>
              <button
                type="submit"
                disabled={creandoServicio}
                className="w-full bg-primary-950 text-white py-2 rounded-lg hover:bg-primary-700 disabled:opacity-60"
              >
                {creandoServicio ? 'Guardando...' : 'Crear servicio'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Auditoría */}
      <section className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary-950">Auditoría de solicitudes</h2>
            <p className="text-sm text-gray-600">Consulta cada expediente y quién lo atendió por última vez.</p>
          </div>
          <div className="flex gap-3">
            <select
              className="input-field"
              value={estadoFiltro}
              onChange={(e) => { setEstadoFiltro(e.target.value); setPaginaAuditoria(1) }}
            >
              {ESTADOS_SOLICITUD.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchAuditoria}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold text-primary-950"
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Expediente</th>
                <th className="py-2">Servicio / Trámite</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Última atención</th>
                <th className="py-2">Gestionar estado</th>
                <th className="py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {auditoriaLoading && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">Cargando solicitudes...</td>
                </tr>
              )}
              {!auditoriaLoading && auditoria.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">No hay registros para los filtros actuales.</td>
                </tr>
              )}
              {!auditoriaLoading && auditoria.length > 0 && auditoria.map((solicitud) => (
                <tr key={solicitud.id_solicitud} className="border-b last:border-0">
                  <td className="py-3 font-semibold text-primary-950">
                    {solicitud.numero_solicitud || solicitud.numero_expediente || `SOL-${solicitud.id_solicitud}`}
                  </td>
                  <td className="py-3">
                    <p className="font-semibold">{solicitud.nombre_servicio || 'Servicio no disponible'}</p>
                    <p className="text-xs text-gray-500">{solicitud.nombre_tramite || 'Sin trámite'}</p>
                  </td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoBadgeClass(solicitud.estado_actual || solicitud.estado_solicitud)}`}>
                      {solicitud.estado_actual || solicitud.estado_solicitud || 'SIN_ESTADO'}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="font-semibold">{solicitud.ultimo_cambio_por || 'Sin asignar'}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(solicitud.ultimo_cambio_fecha)}</p>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <select
                        className="input-field text-xs"
                        value={estadoEdiciones[solicitud.id_solicitud] || ''}
                        onChange={(e) => manejarSeleccionEstado(solicitud.id_solicitud, e.target.value)}
                      >
                        <option value="">Seleccionar estado</option>
                        {ESTADOS_ACCIONABLES.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => manejarCambioEstadoSolicitud(solicitud)}
                        disabled={!estadoEdiciones[solicitud.id_solicitud] || solicitudActualizando === solicitud.id_solicitud}
                        className="bg-primary-950 text-white text-xs px-3 py-2 rounded disabled:opacity-50"
                      >
                        {solicitudActualizando === solicitud.id_solicitud ? 'Guardando...' : 'Actualizar estado'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col items-center gap-2">
                      <Link
                        to={`/solicitud/${solicitud.id_solicitud}`}
                        className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold"
                      >
                        <FiEye /> Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Página {paginaAuditoria}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaAuditoria === 1}
              onClick={() => setPaginaAuditoria((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setPaginaAuditoria((prev) => prev + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {confirmacionEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !empleadoEliminando) {
              setConfirmacionEliminar(null)
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-primary-950">Eliminar usuario</h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Eliminar definitivamente la cuenta de <strong>{confirmacionEliminar.nombre_completo || confirmacionEliminar.email}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => !empleadoEliminando && setConfirmacionEliminar(null)}
                disabled={Boolean(empleadoEliminando)}
                className="w-full rounded-lg border border-gray-300 py-2 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminarEmpleado}
                disabled={Boolean(empleadoEliminando)}
                className="w-full rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {empleadoEliminando ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
