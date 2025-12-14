import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { FiLogOut, FiMenu } from 'react-icons/fi'
import { getRutaInicioEmpleado } from '../../utils/rutasEmpleado'
import ChangePasswordModal from '../auth/ChangePasswordModal'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isSolicitante = user?.tipo_usuario === 'SOLICITANTE' || Boolean(user?.id_solicitante)
  const isEmpleado = user?.tipo_usuario === 'EMPLEADO' || Boolean(user?.rol)
  const homeRoute = isSolicitante ? '/dashboard' : getRutaInicioEmpleado(user?.rol)
  const requiereCambioTemporal = Boolean(user?.password_temporal)

  return (
    <nav className="bg-primary-950 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={homeRoute} className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-accent-600 px-3 py-1 rounded">DGCD</span>
            <span>Sustancias</span>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-6">
            {isSolicitante && (
              <>
                <Link to="/dashboard" className="hover:text-accent-600 transition">
                  Mis Solicitudes
                </Link>
                <Link to="/crear-solicitud" className="hover:text-accent-600 transition">
                  Nueva Solicitud
                </Link>
              </>
            )}

            {isEmpleado && (
              <>
                {user.rol === 'VENTANILLA' && (
                  <Link to="/bandeja/ventanilla" className="hover:text-accent-600 transition">
                    Bandeja Ventanilla
                  </Link>
                )}
                {(user.rol === 'TECNICO_UPC' || user.rol === 'ENCARGADO_UPC') && (
                  <Link to="/bandeja/upc" className="hover:text-accent-600 transition">
                    Bandeja UPC
                  </Link>
                )}
                {user.rol === 'DIRECCION' && (
                  <Link to="/bandeja/direccion" className="hover:text-accent-600 transition">
                    Bandeja Dirección
                  </Link>
                )}
                {user.rol === 'DNCD' && (
                  <Link to="/bandeja/dncd" className="hover:text-accent-600 transition">
                    Bandeja DNCD
                  </Link>
                )}
                {user.rol === 'ADMIN' && (
                  <Link to="/admin" className="hover:text-accent-600 transition">
                    Auditoría &amp; Roles
                  </Link>
                )}
              </>
            )}

            {/* Usuario y logout */}
            <div className="flex items-center gap-4 border-l border-accent-600 pl-6">
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                {requiereCambioTemporal && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                )}
                Cambiar contraseña
              </button>
              <span className="text-sm">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-accent-600 px-3 py-2 rounded hover:opacity-90"
              >
                <FiLogOut />
                Salir
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <FiMenu size={24} />
          </button>
        </div>

        {/* Menu móvil desplegable */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-accent-600">
            {isSolicitante && (
              <>
                <Link to="/dashboard" className="block py-2 hover:text-accent-600">
                  Mis Solicitudes
                </Link>
                <Link to="/crear-solicitud" className="block py-2 hover:text-accent-600">
                  Nueva Solicitud
                </Link>
              </>
            )}
            {isEmpleado && (
              <>
                {user.rol === 'VENTANILLA' && (
                  <Link to="/bandeja/ventanilla" className="block py-2 hover:text-accent-600">
                    Bandeja Ventanilla
                  </Link>
                )}
                {(user.rol === 'TECNICO_UPC' || user.rol === 'ENCARGADO_UPC') && (
                  <Link to="/bandeja/upc" className="block py-2 hover:text-accent-600">
                    Bandeja UPC
                  </Link>
                )}
                {user.rol === 'DIRECCION' && (
                  <Link to="/bandeja/direccion" className="block py-2 hover:text-accent-600">
                    Bandeja Dirección
                  </Link>
                )}
                {user.rol === 'DNCD' && (
                  <Link to="/bandeja/dncd" className="block py-2 hover:text-accent-600">
                    Bandeja DNCD
                  </Link>
                )}
                {user.rol === 'ADMIN' && (
                  <Link to="/admin" className="block py-2 hover:text-accent-600">
                    Panel Administración
                  </Link>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="block w-full text-left py-2 font-semibold text-accent-400"
            >
              Cambiar contraseña
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left py-2 hover:text-accent-600"
            >
              Salir
            </button>
          </div>
        )}
      </div>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </nav>
  )
}

export default Navbar
