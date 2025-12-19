import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { keepDigitsOnly, preventNonDigitKey } from '../../utils/numericInput'

const DEFAULT_TIPO_SOLICITANTE = 'PROFESIONAL'
const NUMERIC_ONLY_FIELDS = new Set(['cedula_identidad', 'telefono'])

const RegistroSolicitante = () => {
  const [formData, setFormData] = useState({
    tipo_solicitante: DEFAULT_TIPO_SOLICITANTE,
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    nombre_completo: '',
    cedula_identidad: '',
    profesion: 'MEDICINA'
  })
  const [loading, setLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    const sanitizedValue = NUMERIC_ONLY_FIELDS.has(name) ? keepDigitsOnly(value) : value
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFeedbackMessage('')

    try {
      const payload = {
        ...formData,
        tipo_solicitante: DEFAULT_TIPO_SOLICITANTE
      }

      const response = await authAPI.registroSolicitante(payload)
      const correoEnviado = response?.data?.correoEnviado
      const correoOmitido = response?.data?.correoOmitido

      setFeedbackMessage('Te enviamos un correo para completar el registro. Si no lo ves, revisa tu carpeta de spam.')

      if (correoEnviado) {
        toast.success('Revisa tu correo para confirmar la cuenta')
      } else if (correoOmitido) {
        toast('Registro guardado. El envío de correos está deshabilitado en este entorno, solicita el enlace al administrador.', { icon: 'ℹ️' })
      } else {
        toast('Registro guardado, pero no pudimos enviar el correo. Contacta al administrador para recibir el enlace.', { icon: '⚠️' })
      }
      navigate('/login', { replace: true })
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
            {/* Tipo de solicitante (informativo) */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Tipo de solicitante</p>
              <p className="text-lg font-semibold text-primary-950">
                Externo (gestionado por la administración)
              </p>
            </div>

            {/* Cédula */}
            <div className="form-group">
              <label htmlFor="cedula_identidad" className="form-label required">
                Cédula de Identidad
              </label>
              <input
                id="cedula_identidad"
                type="text"
                name="cedula_identidad"
                className="input-field"
                value={formData.cedula_identidad}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={preventNonDigitKey}
                required
                placeholder="000-0000000-0"
              />
            </div>

            {/* Nombre completo */}
            <div className="form-group">
              <label htmlFor="nombre_completo" className="form-label required">
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

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label required">
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
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={preventNonDigitKey}
              />
            </div>

            {/* Profesión (si aplica) */}
            {formData.tipo_solicitante === 'PROFESIONAL' && (
              <div className="form-group">
                <label htmlFor="profesion" className="form-label required">
                  Profesión
                </label>
                <select
                  id="profesion"
                  name="profesion"
                  className="input-field"
                  value={formData.profesion}
                  onChange={handleChange}
                  required
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
                <label htmlFor="password" className="form-label required">
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
                <label htmlFor="confirmPassword" className="form-label required">
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

            {feedbackMessage && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                {feedbackMessage}
              </p>
            )}
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
