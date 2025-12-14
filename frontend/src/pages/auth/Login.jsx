import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { getRutaInicioEmpleado } from '../../utils/rutasEmpleado'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [tipoUsuario, setTipoUsuario] = useState('solicitante')
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const isEmpleado = tipoUsuario === 'empleado'

  const encabezado = useMemo(() => ({
    titulo: 'DGCD',
    subtitulo: 'Sistema de Gestión de Sustancias Controladas',
    detalle: isEmpleado ? 'Portal interno - Empleados / Administradores' : 'Portal para Solicitantes'
  }), [isEmpleado])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEmpleado) {
        const response = await authAPI.loginEmpleado(email, password)
        const empleado = response.data.empleado
        setUser({ ...empleado, tipo_usuario: 'EMPLEADO' }, response.data.token)
        toast.success(empleado.rol === 'ADMIN' ? 'Bienvenido, administrador' : '¡Bienvenido al sistema!')
        navigate(getRutaInicioEmpleado(empleado.rol))
        return
      }

      const response = await authAPI.loginSolicitante(email, password)
      setUser({ ...response.data.solicitante, tipo_usuario: 'SOLICITANTE' }, response.data.token)
      toast.success('¡Bienvenido!')
      navigate('/dashboard')
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
          <div className="flex gap-2 mb-6" role="tablist">
            {['solicitante', 'empleado'].map((tipo) => (
              <button
                key={tipo}
                type="button"
                role="tab"
                aria-selected={tipoUsuario === tipo}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${
                  tipoUsuario === tipo
                    ? 'bg-primary-950 text-white border-primary-950'
                    : 'border-gray-200 text-gray-600 hover:text-primary-950'
                }`}
                onClick={() => {
                  setTipoUsuario(tipo)
                  setEmail('')
                  setPassword('')
                }}
              >
                {tipo === 'solicitante' ? 'Solicitante' : 'Empleado / Admin'}
              </button>
            ))}
          </div>

          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-950 mb-2">
              {encabezado.titulo}
            </h1>
            <p className="text-primary-700">
              {encabezado.subtitulo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {encabezado.detalle}
            </p>
          </div>

          {isEmpleado && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6 text-sm text-yellow-800">
              ⚠️ Acceso exclusivo para personal autorizado del MSP. Incluye cuentas ADMIN.
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {isEmpleado ? 'Email corporativo' : 'Email'}
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={isEmpleado ? 'usuario@msp.gob.do' : 'tu@email.com'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
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
          <div className="mt-6 space-y-3 text-center text-sm">
            {!isEmpleado && (
              <p className="text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link to="/registro" className="text-accent-600 font-semibold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            )}

            {isEmpleado && (
              <p className="text-gray-600">
                ¿Necesitas volver al portal público?{' '}
                <button
                  type="button"
                  className="text-accent-600 font-semibold hover:underline"
                  onClick={() => setTipoUsuario('solicitante')}
                >
                  Cambia a modo solicitante
                </button>
              </p>
            )}
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

export default Login
