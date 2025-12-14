import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
})

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

// ============================================
// AUTENTICACIÓN
// ============================================

export const authAPI = {
  registroSolicitante: (datos) =>
    api.post('/auth/registro-solicitante', datos),

  loginSolicitante: (email, password) =>
    api.post('/auth/login-solicitante', { email, password }),

  loginEmpleado: (email, password) =>
    api.post('/auth/login-empleado', { email, password }),

  verificarToken: () =>
    api.get('/auth/verify'),

  cambiarContraseña: (passwordActual, passwordNueva) =>
    api.post('/auth/cambiar-password', { passwordActual, passwordNueva })
}

// ============================================
// SOLICITANTES
// ============================================

export const solicitanteAPI = {
  obtenerPerfil: () =>
    api.get('/solicitantes/perfil')
}

// ============================================
// SOLICITUDES
// ============================================

export const solicitudAPI = {
  crear: (datos) =>
    api.post('/solicitudes', datos),

  obtener: (id) =>
    api.get(`/solicitudes/${id}`),

  misSolicitudes: (pagina = 1, porPagina = 10) =>
    api.get('/solicitudes/mis-solicitudes', {
      params: { pagina, porPagina }
    }),

  obtenerPorEstado: (estado, pagina = 1, porPagina = 20, filtros = {}) =>
    api.get(`/solicitudes/estado/${estado}`, {
      params: { pagina, porPagina, ...filtros }
    }),

  cambiarEstado: (id, estado_nuevo, comentario = '') =>
    api.put(`/solicitudes/${id}/estado`, { nuevoEstado: estado_nuevo, comentario }),

  obtenerHistorial: (id) =>
    api.get(`/solicitudes/${id}/historial`),

  obtenerRevisionCampos: (id) =>
    api.get(`/solicitudes/${id}/revision-campos`),

  guardarRevisionCampos: (id, campos) =>
    api.put(`/solicitudes/${id}/revision-campos`, { campos }),

  agregarSustancia: (id, datos) =>
    api.post(`/solicitudes/${id}/sustancias`, datos),

  reenviarCorrecciones: (id, datos) =>
    api.put(`/solicitudes/${id}/reenviar`, datos)
}

// ============================================
// EMPLEADOS & ADMIN
// ============================================

export const empleadoAPI = {
  listar: (params = {}) =>
    api.get('/empleados', { params }),

  crear: (datos) =>
    api.post('/empleados', datos),

  actualizar: (id, datos) =>
    api.put(`/empleados/${id}`, datos),

  eliminar: (id) =>
    api.delete(`/empleados/${id}`)
}

export const adminAPI = {
  solicitudesAuditoria: (params = {}) =>
    api.get('/solicitudes/admin/auditoria', { params })
}

// ============================================
// SERVICIOS
// ============================================

export const servicioAPI = {
  listar: (params = {}) =>
    api.get('/servicios', { params }),

  crear: (datos) =>
    api.post('/servicios', datos)
}

// ============================================
// ARCHIVOS
// ============================================

export const archivoAPI = {
  subir: (id_solicitud, tipo_archivo, archivo) => {
    const formData = new FormData()
    formData.append('id_solicitud', id_solicitud)
    formData.append('tipo_archivo', tipo_archivo)
    formData.append('archivo', archivo)

    return api.post('/archivos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  obtenerPorSolicitud: (id_solicitud) =>
    api.get(`/solicitudes/${id_solicitud}/archivos`),

  actualizarRevision: (id, estado, comentario = '') =>
    api.patch(`/archivos/${id}/revision`, { estado, comentario }),

  descargar: (id) =>
    api.get(`/archivos/${id}/descargar`, { responseType: 'blob' }),

  eliminar: (id) =>
    api.delete(`/archivos/${id}`)
}

// ============================================
// PAGOS
// ============================================

export const pagoAPI = {
  obtenerPorSolicitud: (id_solicitud) =>
    api.get(`/pagos/solicitud/${id_solicitud}`),

  listarPendientes: (pagina = 1, porPagina = 20) =>
    api.get('/pagos/pendientes', {
      params: { pagina, porPagina }
    }),

  confirmar: (id_pago, idArchivoComprobante = null) =>
    api.post(`/pagos/${id_pago}/confirmar`, { idArchivoComprobante })
}

// ============================================
// CERTIFICADOS
// ============================================

export const certificadoAPI = {
  obtenerPorSolicitud: (id_solicitud) =>
    api.get(`/certificados/solicitud/${id_solicitud}`),

  listar: (pagina = 1, porPagina = 20) =>
    api.get('/certificados', {
      params: { pagina, porPagina }
    }),

  descargarPDF: (id) =>
    api.get(`/certificados/${id}/descargar`, { responseType: 'blob' }),

  descargarPDFPorSolicitud: (id_solicitud) =>
    api.get(`/certificados/solicitud/${id_solicitud}/descargar`, { responseType: 'blob' })
}

export default api
