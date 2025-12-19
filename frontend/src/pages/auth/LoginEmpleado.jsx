import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { getRutaInicioEmpleado } from '../../utils/rutasEmpleado'

const LoginEmpleado = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.loginEmpleado(email, password)
      const empleado = response.data.empleado
      setUser({ ...empleado, tipo_usuario: 'EMPLEADO' }, response.data.token)
      toast.success(empleado.rol === 'ADMIN' ? 'Bienvenido, administrador' : '¡Bienvenido al sistema!')
      navigate(getRutaInicioEmpleado(empleado.rol))
    } catch (error) {
      toast.error(error.message || 'Error en el login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-700 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-950 mb-2">
              DGCD
            </h1>
            <p className="text-primary-700">
              Sistema de Gestión de Sustancias Controladas
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Portal Interno - Empleados del MSP
            </p>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6 text-sm">
            <p className="text-yellow-800">
              ⚠️ Este acceso es solo para empleados del Ministerio de Salud Pública.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="form-label required">
                Email Corporativo
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@msp.gob.do"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label required">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-950 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Enlaces */}
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-accent-600 font-semibold hover:underline">
              ← Volver a login solicitante
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white text-xs mt-8">
          <p>© 2024 Ministerio de Salud Pública - Ley 50-88</p>
        </div>
      </div>
    </div>
  )
}

export default LoginEmpleado
