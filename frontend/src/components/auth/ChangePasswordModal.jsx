import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const DEFAULT_FORM = {
  passwordActual: '',
  passwordNueva: '',
  passwordConfirmacion: ''
}

const ChangePasswordModal = ({ open, onClose }) => {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)

  const forzadoPorTemporal = Boolean(user?.password_temporal)
  const titulo = useMemo(() => (
    forzadoPorTemporal ? 'Actualiza tu contraseña temporal' : 'Cambiar contraseña'
  ), [forzadoPorTemporal])

  useEffect(() => {
    if (!open) {
      setForm({ ...DEFAULT_FORM })
      setSubmitting(false)
    }
  }, [open])

  if (!open) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (form.passwordNueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    if (form.passwordNueva !== form.passwordConfirmacion) {
      toast.error('La confirmación no coincide')
      return
    }

    if (form.passwordNueva === form.passwordActual) {
      toast.error('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setSubmitting(true)
    try {
      await authAPI.cambiarContraseña(form.passwordActual, form.passwordNueva)
      toast.success('Contraseña actualizada correctamente')
      updateUser({ password_temporal: false })
      onClose?.()
    } catch (error) {
      const mensaje = typeof error === 'string'
        ? error
        : error?.message || 'No se pudo cambiar la contraseña'
      toast.error(mensaje)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !submitting) {
      onClose?.()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-600">
            Seguridad
          </p>
          <h2 className="mt-1 text-2xl font-bold text-primary-950">{titulo}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {forzadoPorTemporal
              ? 'Ingresa una contraseña definitiva para seguir usando la plataforma.'
              : 'Protege tu cuenta actualizando tu contraseña periódicamente.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="form-label required" htmlFor="passwordActual">
              Contraseña actual
            </label>
            <input
              id="passwordActual"
              type="password"
              className="input-field"
              value={form.passwordActual}
              onChange={(e) => setForm((prev) => ({ ...prev, passwordActual: e.target.value }))}
              required
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="form-label required" htmlFor="passwordNueva">
              Nueva contraseña
            </label>
            <input
              id="passwordNueva"
              type="password"
              className="input-field"
              value={form.passwordNueva}
              onChange={(e) => setForm((prev) => ({ ...prev, passwordNueva: e.target.value }))}
              required
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres, mezcla letras y números.</p>
          </div>

          <div>
            <label className="form-label required" htmlFor="passwordConfirmacion">
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirmacion"
              type="password"
              className="input-field"
              value={form.passwordConfirmacion}
              onChange={(e) => setForm((prev) => ({ ...prev, passwordConfirmacion: e.target.value }))}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-300 py-2 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary-950 py-2 font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
