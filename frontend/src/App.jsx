import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Páginas de autenticación
import Login from './pages/auth/Login'
import RegistroSolicitante from './pages/auth/RegistroSolicitante'
import LoginEmpleado from './pages/auth/LoginEmpleado'

// Páginas de solicitante
import DashboardSolicitante from './pages/solicitante/DashboardSolicitante'
import CrearSolicitud from './pages/solicitante/CrearSolicitud'
import DetalleSolicitud from './pages/solicitante/DetalleSolicitud'
import MiPerfil from './pages/solicitante/MiPerfil'

// Páginas internas (empleados)
import BandejaVentanilla from './pages/empleado/BandejaVentanilla'
import BandejaUPC from './pages/empleado/BandejaUPC'
import BandejaDireccion from './pages/empleado/BandejaDireccion'
import BandejaDNCD from './pages/empleado/BandejaDNCD'
import DetalleRevision from './pages/empleado/DetalleRevision'

// Páginas de administración
import AdminPanel from './pages/admin/AdminPanel'

// Layout y componentes
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuthStore } from './store/authStore'

const CorreccionesSolicitudRoute = () => {
  const { id } = useParams()
  return (
    <ProtectedRoute>
      <CrearSolicitud solicitudId={id} />
    </ProtectedRoute>
  )
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-empleado" element={<LoginEmpleado />} />
          <Route path="/registro" element={<RegistroSolicitante />} />

          {/* Rutas de solicitante */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><DashboardSolicitante /></ProtectedRoute>} 
          />
          <Route 
            path="/crear-solicitud" 
            element={<ProtectedRoute><CrearSolicitud /></ProtectedRoute>} 
          />
          <Route 
            path="/solicitud/:id" 
            element={<ProtectedRoute><DetalleSolicitud /></ProtectedRoute>} 
          />
          <Route 
            path="/solicitud/:id/correcciones" 
            element={<CorreccionesSolicitudRoute />} 
          />
          <Route 
            path="/mi-perfil" 
            element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} 
          />

          {/* Rutas de empleados */}
          <Route 
            path="/bandeja/ventanilla" 
            element={<ProtectedRoute><BandejaVentanilla /></ProtectedRoute>} 
          />
          <Route 
            path="/bandeja/upc" 
            element={<ProtectedRoute><BandejaUPC /></ProtectedRoute>} 
          />
          <Route 
            path="/bandeja/direccion" 
            element={<ProtectedRoute><BandejaDireccion /></ProtectedRoute>} 
          />
          <Route 
            path="/bandeja/dncd" 
            element={<ProtectedRoute><BandejaDNCD /></ProtectedRoute>} 
          />
          <Route 
            path="/revisar/:id" 
            element={<ProtectedRoute><DetalleRevision /></ProtectedRoute>} 
          />

          {/* Rutas de administración */}
          <Route 
            path="/admin" 
            element={<ProtectedRoute requiredRole="ADMIN"><AdminPanel /></ProtectedRoute>} 
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
