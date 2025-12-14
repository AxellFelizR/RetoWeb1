import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

const RegistroSolicitante = () => {
  const [formData, setFormData] = useState({
    tipo_solicitante: 'PROFESIONAL',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    nombre_completo: '',
    cedula_identidad: '',
    profesion: 'MEDICINA'
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.registroSolicitante(formData)
      setUser(response.data.solicitante, response.data.token)
      toast.success('¡Registro exitoso!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message || 'Error en el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 to-primary-700 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Encabezado */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-950 mb-2">
              Registro de Solicitante
            </h1>
            <p className="text-gray-600">
              Complete el formulario para registrarse en el sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de solicitante */}
            <div className="form-group">
              <label htmlFor="tipo_solicitante" className="form-label">
                Tipo de Solicitante
              </label>
              <select
                id="tipo_solicitante"
                name="tipo_solicitante"
                className="input-field"
                value={formData.tipo_solicitante}
                onChange={handleChange}
              >
                <option value="PROFESIONAL">Profesional de la Salud</option>
                <option value="ESTABLECIMIENTO_PRIVADO">Establecimiento Privado</option>
                <option value="INSTITUCION_PUBLICA">Institución Pública</option>
                <option value="IMPORTADORA">Empresa Importadora</option>
              </select>
            </div>

            {/* Nombre completo */}
            <div className="form-group">
              <label htmlFor="nombre_completo" className="form-label">
                Nombre Completo
              </label>
              <input
                id="nombre_completo"
                type="text"
                name="nombre_completo"
                className="input-field"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
              />
            </div>

            {/* Cédula */}
            <div className="form-group">
              <label htmlFor="cedula_identidad" className="form-label">
                Cédula de Identidad
              </label>
              <input
                id="cedula_identidad"
                type="text"
                name="cedula_identidad"
                className="input-field"
                value={formData.cedula_identidad}
                onChange={handleChange}
                required
                placeholder="000-0000000-0"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="input-field"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Teléfono */}
            <div className="form-group">
              <label htmlFor="telefono" className="form-label">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                className="input-field"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            {/* Profesión (si aplica) */}
            {formData.tipo_solicitante === 'PROFESIONAL' && (
              <div className="form-group">
                <label htmlFor="profesion" className="form-label">
                  Profesión
                </label>
                <select
                  id="profesion"
                  name="profesion"
                  className="input-field"
                  value={formData.profesion}
                  onChange={handleChange}
                >
                  <option value="MEDICINA">Medicina</option>
                  <option value="MEDICINA_VETERINARIA">Medicina Veterinaria</option>
                  <option value="ODONTOLOGIA">Odontología</option>
                  <option value="OTRA">Otra</option>
                </select>
              </div>
            )}

            {/* Contraseña */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="input-field"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-950 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 mt-6"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          {/* Enlace a login */}
          <div className="text-center mt-6 text-sm">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent-600 font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroSolicitante
