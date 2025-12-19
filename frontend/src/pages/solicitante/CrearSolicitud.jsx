import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { archivoAPI, servicioAPI, solicitudAPI, solicitanteAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import SERVICIO_FORM_CONFIG from '../../config/serviciosFormConfig'
import {
  TIPOS_SERVICIO,
  TIPOS_TRAMITE
} from '../../constants/solicitudOptions'
import { parseMontoDesdeLabel } from '../../utils/solicitudHelpers'
import {
  keepDecimalNumber,
  keepDigitsOnly,
  preventNonDecimalKey,
  preventNonDigitKey
} from '../../utils/numericInput'

const iterateServiceFields = (serviceConfig, callback) => {
  if (!serviceConfig?.sections) return
  for (const section of serviceConfig.sections) {
    if (!section.fields) continue
    for (const field of section.fields) {
      callback(field)
    }
  }
}

const NUMERIC_FIELD_PATTERNS = ['telefono', 'telefonos', 'celular', 'cedula', 'rnc', 'colegiatura']
const NUMERIC_FIELD_EXCEPTIONS = new Set()

const resolveNumericStrategy = (field) => {
  if (!field?.name) return null
  if (field.numericStrategy) return field.numericStrategy
  if (field.allowDecimal) return 'decimal'
  if (field.numericOnly === true) return 'digits'
  if (field.numericOnly === false) return null
  const normalized = field.name.toLowerCase()
  if (NUMERIC_FIELD_EXCEPTIONS.has(field.name)) return null
  if (NUMERIC_FIELD_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return 'digits'
  }
  return null
}

const sanitizeValueByStrategy = (strategy, value) => {
  if (strategy === 'digits') return keepDigitsOnly(value)
  if (strategy === 'decimal') return keepDecimalNumber(value)
  return value
}

const getNumericInputAttributes = (strategy) => {
  if (strategy === 'digits') {
    return {
      inputMode: 'numeric',
      pattern: '[0-9]*',
      onKeyDown: preventNonDigitKey
    }
  }
  if (strategy === 'decimal') {
    return {
      inputMode: 'decimal',
      onKeyDown: preventNonDecimalKey
    }
  }
  return {}
}

const CrearSolicitud = ({ solicitudId: solicitudIdProp = null } = {}) => {
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const solicitudId = solicitudIdProp ? String(solicitudIdProp) : null
  const [initializing, setInitializing] = useState(Boolean(solicitudId))
  const modoCorreccion = Boolean(solicitudId)
  const { user, updateUser } = useAuthStore()
  useEffect(() => {
    if (!user) {
      return
    }

    const tieneCedula = Boolean(user.cedula || user.cedula_identidad || user.numero_documento)

    if (tieneCedula) {
      return
    }

    let cancelado = false

    const cargarPerfil = async () => {
      try {
        const respuesta = await solicitanteAPI.obtenerPerfil()
        const perfil = respuesta?.data
        if (!cancelado && perfil) {
          updateUser(perfil)
        }
      } catch (error) {
        console.warn('No se pudo sincronizar el perfil del solicitante', error)
      }
    }

    cargarPerfil()

    return () => {
      cancelado = true
    }
  }, [user, updateUser])

  const [formData, setFormData] = useState({
    id_tipo_servicio: '',
    id_tipo_tramite: '',
    numero_cidc_anterior: '',
    motivo_detalle: ''
  })

  const [datosServicio, setDatosServicio] = useState({})
  const [documentosAdjuntos, setDocumentosAdjuntos] = useState({})
  const [documentosPrevios, setDocumentosPrevios] = useState([])
  const [tiposServicio, setTiposServicio] = useState(TIPOS_SERVICIO)
  const [cargandoServicios, setCargandoServicios] = useState(false)
  const [toggles, setToggles] = useState({})
  const tiposTramite = TIPOS_TRAMITE

  const userDefaults = useMemo(() => {
    if (!user) return {}
    const defaults = {
      nombre: user.nombre_completo || user.nombre || '',
      cedula: user.cedula || user.cedula_identidad || user.numero_documento || '',
      email: user.email || '',
      profesion: user.profesion || ''
    }
    return Object.fromEntries(
      Object.entries(defaults).filter(([, value]) => Boolean(value))
    )
  }, [user])

  const currentTramite = useMemo(() => {
    if (!formData.id_tipo_tramite) return null
    return (
      tiposTramite.find(
        (tramite) => tramite.id.toString() === formData.id_tipo_tramite.toString()
      ) || null
    )
  }, [formData.id_tipo_tramite, tiposTramite])

  const currentServiceConfig = useMemo(() => {
    if (!formData.id_tipo_servicio) return null
    const key = Number(formData.id_tipo_servicio)
    return SERVICIO_FORM_CONFIG[key] || null
  }, [formData.id_tipo_servicio])

  const currencyFormatter = useMemo(() => (
    new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    })
  ), [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  useEffect(() => {
    let cancelado = false

    const cargarServicios = async () => {
      try {
        setCargandoServicios(true)
        const respuesta = await servicioAPI.listar({ includeInactivos: false })
        if (cancelado) return
        const servicios = Array.isArray(respuesta?.data) ? respuesta.data : []
        const serviciosAdaptados = servicios.map((servicio) => {
          const diasRespuesta = Number(servicio.dias_respuesta)
          const costoNumerico = Number(servicio.costo_administrativo ?? 0)
          const costoSeguro = Number.isFinite(costoNumerico) ? costoNumerico : 0
          return {
            ...servicio,
            id: Number(servicio.id_tipo_servicio),
            nombre: servicio.nombre_servicio || servicio.nombre,
            descripcion: servicio.descripcion || 'Sin descripción disponible',
            vigencia: Number.isFinite(diasRespuesta) && diasRespuesta > 0
              ? `${diasRespuesta} días de respuesta`
              : 'Tiempo de respuesta no definido',
            costo: servicio.requiere_costo_administrativo
              ? currencyFormatter.format(costoSeguro)
              : 'Sin costo administrativo'
          }
        })
        setTiposServicio(serviciosAdaptados.length > 0 ? serviciosAdaptados : TIPOS_SERVICIO)
      } catch (error) {
        if (cancelado) return
        console.error('No se pudieron cargar los servicios dinamicos:', error)
        toast.error('No se pudieron cargar los servicios. Mostramos el catálogo base.')
        setTiposServicio(TIPOS_SERVICIO)
      } finally {
        if (!cancelado) {
          setCargandoServicios(false)
        }
      }
    }

    cargarServicios()

    return () => {
      cancelado = true
    }
  }, [currencyFormatter])

  useEffect(() => {
    if (!modoCorreccion || !solicitudId) {
      setInitializing(false)
      return
    }

    const cargarSolicitud = async () => {
      try {
        setInitializing(true)
        const detalle = await solicitudAPI.obtener(solicitudId)
        const solicitudDetalle = detalle.data

        if (!solicitudDetalle) {
          throw new Error('Solicitud no encontrada')
        }

        if (solicitudDetalle.estado_solicitud !== 'DEVUELTA_VENTANILLA') {
          toast.error('Solo puedes corregir solicitudes devueltas por Ventanilla')
          navigate(`/solicitud/${solicitudId}`)
          return
        }

        setFormData({
          id_tipo_servicio: Number(solicitudDetalle.id_tipo_servicio) || '',
          id_tipo_tramite: solicitudDetalle.id_tipo_tramite?.toString() || '',
          numero_cidc_anterior: solicitudDetalle.numero_cidc_anterior || '',
          motivo_detalle: solicitudDetalle.motivo_detalle || ''
        })
        setDatosServicio(solicitudDetalle.datos_servicio || {})
        setDocumentosPrevios(Array.isArray(solicitudDetalle.documentos_reportados) ? solicitudDetalle.documentos_reportados : [])
        setDocumentosAdjuntos({})
        setToggles({})
      } catch (error) {
        toast.error(error?.message || 'No se pudo cargar la solicitud')
        navigate('/dashboard')
      } finally {
        setInitializing(false)
      }
    }

    cargarSolicitud()
  }, [modoCorreccion, solicitudId, navigate])

  useEffect(() => {
    if (!currentServiceConfig) {
      setDatosServicio({})
      setDocumentosAdjuntos({})
      setToggles({})
      return
    }

    if (modoCorreccion) {
      return
    }

    const defaults = {}
    iterateServiceFields(currentServiceConfig, (field) => {
      if (field.prefill && userDefaults[field.prefill]) {
        defaults[field.name] = userDefaults[field.prefill]
      } else if (field.type === 'checkbox-group') {
        defaults[field.name] = []
      }
    })

    if (currentServiceConfig.resumenPago) {
      defaults.suma_pagar = currentServiceConfig.resumenPago
    }

    if (currentTramite) {
      defaults.estatus_tramite = currentTramite.nombre
    }

    setDatosServicio(defaults)
    setDocumentosAdjuntos({})
    setToggles({})
  }, [currentServiceConfig, currentTramite, userDefaults, modoCorreccion])

  const updateDato = (name, value) => {
    setDatosServicio((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxGroupChange = (name, optionValue, checked) => {
    setDatosServicio((prev) => {
      const prevValue = Array.isArray(prev[name]) ? prev[name] : []
      const nextValue = checked
        ? Array.from(new Set([...prevValue, optionValue]))
        : prevValue.filter((val) => val !== optionValue)
      return { ...prev, [name]: nextValue }
    })
  }

  const handleDocumentChange = (docName, files) => {
    setDocumentosAdjuntos((prev) => ({
      ...prev,
      [docName]: files ? Array.from(files) : []
    }))
  }

  const handleToggleChange = (name, value) => {
    setToggles((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const shouldShowField = useCallback((field) => {
    if (!field.showWhen) return true
    const compareValue = datosServicio[field.showWhen.field]
    if (field.showWhen.equals !== undefined) {
      return compareValue === field.showWhen.equals
    }
    if (field.showWhen.includes) {
      return Array.isArray(compareValue)
        ? compareValue.includes(field.showWhen.includes)
        : compareValue === field.showWhen.includes
    }
    return true
  }, [datosServicio])

  const visibleDocumentGroups = useMemo(() => {
    if (!currentServiceConfig?.documentGroups) return []
    const tramiteId = formData.id_tipo_tramite || ''
    return currentServiceConfig.documentGroups
      .filter((group) =>
        group.appliesTo ? group.appliesTo.includes(tramiteId) : true
      )
      .map((group) => ({
        ...group,
        documents: group.documents.filter((doc) => {
          if (doc.appliesTo && !doc.appliesTo.includes(tramiteId)) {
            return false
          }
          if (!modoCorreccion && doc.onlyWhenToggle && !toggles[doc.onlyWhenToggle]) {
            return false
          }
          if (!modoCorreccion && doc.hideWhenToggle && toggles[doc.hideWhenToggle]) {
            return false
          }
          return true
        })
      }))
      .filter((group) => group.documents.length > 0)
  }, [currentServiceConfig, formData.id_tipo_tramite, toggles, modoCorreccion])

  const documentosPreviosMap = useMemo(() => {
    const mapa = new Map()
    if (!Array.isArray(documentosPrevios)) {
      return mapa
    }

    for (const group of documentosPrevios) {
      const docs = Array.isArray(group.documents) ? group.documents : []
      for (const doc of docs) {
        const key = doc.name || doc.label
        if (key) {
          mapa.set(key, Boolean(doc.adjuntado))
        }
      }
    }

    return mapa
  }, [documentosPrevios])

  const isDocRequired = (doc) => {
    if (typeof doc.requiredWhen === 'function') {
      return doc.requiredWhen(formData.id_tipo_tramite, toggles)
    }
    if (doc.required === false) return false
    return doc.required !== false
  }

  const collectMissingFieldLabels = () => {
    if (!currentServiceConfig) return []
    const missing = []
    iterateServiceFields(currentServiceConfig, (field) => {
      if (!shouldShowField(field)) return
      if (!field.required) return
      const value = datosServicio[field.name]
      if (field.type === 'checkbox-group') {
        if (!Array.isArray(value) || value.length === 0) {
          missing.push(field.label)
        }
        return
      }
      if (!value) {
        missing.push(field.label)
      }
    })
    return missing
  }

  const collectMissingDocumentLabels = () => {
    if (visibleDocumentGroups.length === 0) return []
    const missing = []
    for (const group of visibleDocumentGroups) {
      for (const doc of group.documents) {
        if (!isDocRequired(doc)) continue
        const key = doc.name || doc.label
        const nuevosAdjuntos = documentosAdjuntos[doc.name] || []
        const teniaAdjuntoPrevio = documentosPreviosMap.get(key)
        if (nuevosAdjuntos.length === 0 && !(modoCorreccion && teniaAdjuntoPrevio)) {
          missing.push(doc.label)
        }
      }
    }
    return missing
  }

  const subirDocumentosPendientes = async (idSolicitudDestino) => {
    const uploads = []

    for (const group of visibleDocumentGroups) {
      for (const doc of group.documents) {
        const files = documentosAdjuntos[doc.name]
        if (!files?.length) continue
        const tipoDocumento = doc.tipoDocumento || doc.name
        if (!tipoDocumento) continue
        for (const file of files) {
          uploads.push(archivoAPI.subir(idSolicitudDestino, tipoDocumento, file))
        }
      }
    }

    if (uploads.length === 0) {
      return false
    }

    const resultados = await Promise.allSettled(uploads)
    return resultados.some((resultado) => resultado.status === 'rejected')
  }

  const validateDatosYDocumentos = () => {
    if (!currentServiceConfig) return true

    const missingFields = [
      ...collectMissingFieldLabels(),
      ...collectMissingDocumentLabels()
    ]
    if (missingFields.length > 0) {
      toast.error('Completa los campos y documentos requeridos')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!formData.id_tipo_servicio || !formData.id_tipo_tramite) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (!validateDatosYDocumentos()) {
      return
    }

    if (modoCorreccion && !solicitudId) {
      toast.error('No se encontró la solicitud a corregir')
      return
    }

    try {
      setLoading(true)
      const idTipoServicioSeleccionado = Number(formData.id_tipo_servicio)
      const tipoServicioSeleccionado = tiposServicio.find(
        (servicio) => servicio.id === idTipoServicioSeleccionado
      )

      const resumenDocumentos = visibleDocumentGroups.map((group) => ({
        title: group.title,
        documents: group.documents.map((doc) => ({
          name: doc.name,
          label: doc.label,
          requerido: isDocRequired(doc),
          adjuntado:
            Boolean(documentosAdjuntos[doc.name]?.length) ||
            Boolean(documentosPreviosMap.get(doc.name || doc.label))
        }))
      }))

      const payload = {
        ...formData,
        id_tipo_servicio: idTipoServicioSeleccionado,
        id_tipo_tramite: Number(formData.id_tipo_tramite),
        nombre_tramite: currentTramite?.nombre || null,
        numero_cidc_anterior: formData.numero_cidc_anterior || null,
        motivo_detalle: formData.motivo_detalle || null,
        datos_servicio: datosServicio,
        documentos_reportados: resumenDocumentos,
        resumen_pago_label: currentServiceConfig?.resumenPago || null,
        monto_total_reportado: parseMontoDesdeLabel(tipoServicioSeleccionado?.costo)
      }

      const response = modoCorreccion
        ? await solicitudAPI.reenviarCorrecciones(solicitudId, payload)
        : await solicitudAPI.crear(payload)
      const solicitudDestino = response.data

      const huboErroresEnArchivos = await subirDocumentosPendientes(solicitudDestino.id_solicitud)
      if (huboErroresEnArchivos) {
        toast.error('Algunos archivos no se pudieron subir. Puedes reintentarlo desde el detalle de la solicitud.')
      }

      toast.success(
        modoCorreccion
          ? 'Correcciones enviadas a Ventanilla'
          : '¡Solicitud creada exitosamente!'
      )

      navigate(`/solicitud/${solicitudDestino.id_solicitud}`, {
        state: {
          justCreated: !modoCorreccion,
          justResubmitted: modoCorreccion,
          wizardSummary: {
            tipoServicio: tipoServicioSeleccionado?.nombre,
            tipoTramite: currentTramite?.nombre,
            numeroCIDCAnterior: formData.numero_cidc_anterior,
            motivoDetalle: formData.motivo_detalle,
            campos: resumenCampos,
            documentos: resumenDocumentos
          }
        }
      })
    } catch (error) {
      toast.error(error.message || 'Error al crear solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = () => {
    if (paso === 1 && !formData.id_tipo_servicio) {
      toast.error('Selecciona un tipo de servicio')
      return
    }
    if (paso === 2 && !formData.id_tipo_tramite) {
      toast.error('Selecciona un tipo de tramite')
      return
    }
    if (paso === 3 && !validateDatosYDocumentos()) {
      return
    }
    setPaso((prev) => Math.min(4, prev + 1))
  }

  const steps = [
    { id: 1, label: 'Tipo de servicio' },
    { id: 2, label: 'Tipo de tramite' },
    { id: 3, label: 'Datos y documentos' },
    { id: 4, label: 'Revision' }
  ]

  const submitLabel = modoCorreccion ? 'Reenviar solicitud' : 'Crear Solicitud'
  const submitLoadingLabel = modoCorreccion ? 'Reenviando...' : 'Creando...'

  const renderField = (field) => {
    if (!shouldShowField(field)) return null
    const isReadOnly = field.readOnly && (!field.prefill || Boolean(userDefaults[field.prefill]))
    const numericStrategy = resolveNumericStrategy(field)
    const handleValueChange = (eventValue) => {
      updateDato(field.name, sanitizeValueByStrategy(numericStrategy, eventValue))
    }
    const commonProps = {
      id: field.name,
      name: field.name,
      value: datosServicio[field.name] || '',
      onChange: (e) => handleValueChange(e.target.value),
      className: 'input-field',
      required: field.required,
      readOnly: isReadOnly
    }

    if (field.type === 'textarea') {
      const labelClass = field.required ? 'form-label required' : 'form-label'
      return (
        <div key={field.name} className="form-group">
          <label className={labelClass} htmlFor={field.name}>{field.label}</label>
          <textarea {...commonProps} rows={field.rows || 3} />
        </div>
      )
    }

    if (field.type === 'select') {
      const labelClass = field.required ? 'form-label required' : 'form-label'
      return (
        <div key={field.name} className="form-group">
          <label className={labelClass} htmlFor={field.name}>{field.label}</label>
          <select
            {...commonProps}
            value={datosServicio[field.name] || ''}
            onChange={(e) => updateDato(field.name, e.target.value)}
          >
            <option value="">Selecciona una opcion</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (field.type === 'checkbox-group') {
      const selected = Array.isArray(datosServicio[field.name])
        ? datosServicio[field.name]
        : []
      const labelClass = field.required ? 'form-label required' : 'form-label'
      return (
        <div key={field.name} className="form-group">
          <label className={labelClass}>{field.label}</label>
          <div className="flex flex-wrap gap-3">
            {field.options?.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={(e) =>
                    handleCheckboxGroupChange(field.name, option.value, e.target.checked)
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )
    }

    const resolveInputType = () => {
      if (field.type === 'email') return 'email'
      if (field.type === 'tel') return 'tel'
      if (field.type === 'number') return 'number'
      return 'text'
    }

    const labelClass = field.required ? 'form-label required' : 'form-label'
    const numericInputProps = getNumericInputAttributes(numericStrategy)
    return (
      <div key={field.name} className="form-group">
        <label className={labelClass} htmlFor={field.name}>{field.label}</label>
        <input
          {...commonProps}
          {...numericInputProps}
          type={resolveInputType()}
        />
      </div>
    )
  }


  const renderDocumentInput = (doc) => {
    const key = doc.name || doc.label
    const value = documentosAdjuntos[doc.name] || []
    const teniaAdjuntoPrevio = documentosPreviosMap.get(key)
    const labelClass = isDocRequired(doc) ? 'form-label required' : 'form-label'
    return (
      <div key={doc.name} className="form-group">
        <label className={labelClass} htmlFor={doc.name}>
          {doc.label}
        </label>
        <input
          id={doc.name}
          type="file"
          accept={doc.accept}
          multiple={doc.multiple}
          onChange={(e) => handleDocumentChange(doc.name, e.target.files)}
        />
        {(doc.descripcion || doc.tamanoMaxMb) && (
          <p className="text-xs text-gray-500 mt-1">
            {doc.descripcion}
            {doc.tamanoMaxMb ? `${doc.descripcion ? ' · ' : ''}Máx ${doc.tamanoMaxMb}MB` : ''}
          </p>
        )}
        {value.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">
            {value.map((file) => file.name).join(', ')}
          </p>
        )}
        {modoCorreccion && value.length === 0 && teniaAdjuntoPrevio && (
          <p className="text-xs text-gray-600 mt-1">
            Mantendremos el archivo enviado anteriormente mientras no selecciones uno nuevo.
          </p>
        )}
      </div>
    )
  }

  const renderToggles = () => {
    if (!currentServiceConfig?.toggles || modoCorreccion) return null
    const tramiteId = formData.id_tipo_tramite || ''
    return (
      <div className="grid grid-cols-1 gap-3">
        {currentServiceConfig.toggles
          .filter((toggle) =>
            toggle.appliesTo ? toggle.appliesTo.includes(tramiteId) : true
          )
          .map((toggle) => (
            <label key={toggle.name} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={!!toggles[toggle.name]}
                onChange={(e) => handleToggleChange(toggle.name, e.target.checked)}
              />
              <span className="text-sm text-gray-700">{toggle.label}</span>
            </label>
          ))}
      </div>
    )
  }

  const resumenCampos = useMemo(() => {
    if (!currentServiceConfig?.sections) return []
    const items = []
    iterateServiceFields(currentServiceConfig, (field) => {
      if (!shouldShowField(field)) return
      const valor = datosServicio[field.name]
      if (!valor) return
      items.push({
        label: field.label,
        valor: Array.isArray(valor) ? valor.join(', ') : valor
      })
    })
    return items
  }, [currentServiceConfig, datosServicio, shouldShowField])

  const renderResumenDocumentos = () => {
    if (visibleDocumentGroups.length === 0) return null
    return (
      <div className="space-y-3">
        {visibleDocumentGroups.map((group, groupIndex) => (
          <div key={`${group.title}-${groupIndex}`} className="border rounded p-3">
            <p className="font-semibold text-primary-950 text-sm mb-2">{group.title}</p>
            <ul className="space-y-1 text-sm">
              {group.documents.map((doc, docIndex) => {
                const key = doc.name || doc.label
                const hasFile = documentosAdjuntos[doc.name]?.length > 0
                const previoAdjunto = documentosPreviosMap.get(key)
                let statusLabel = 'Pendiente'
                if (hasFile) {
                  statusLabel = modoCorreccion ? 'Nuevo adjunto' : 'Adjuntado'
                } else if (previoAdjunto) {
                  statusLabel = 'Adjuntado anteriormente'
                }
                return (
                  <li key={`${doc.name}-${docIndex}`} className="flex justify-between">
                    <span>{doc.label}</span>
                    <span className={(hasFile || previoAdjunto) ? 'text-green-600' : 'text-red-600'}>
                      {statusLabel}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  let serviciosDisponibles
  if (cargandoServicios) {
    serviciosDisponibles = (
      <p className="text-gray-500 text-sm">Cargando servicios disponibles...</p>
    )
  } else if (tiposServicio.length === 0) {
    serviciosDisponibles = (
      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
        No hay servicios disponibles en este momento. Contacta a ventanilla para más información.
      </p>
    )
  } else {
    serviciosDisponibles = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiposServicio.map((servicio) => (
          <button
            key={servicio.id}
            type="button"
            onClick={() => {
              if (modoCorreccion) return
              setFormData((prev) => ({
                ...prev,
                id_tipo_servicio: servicio.id
              }))
            }}
            className={`p-4 rounded-lg border-2 transition text-left ${
              formData.id_tipo_servicio === servicio.id
                ? 'border-primary-950 bg-primary-50'
                : 'border-gray-200 hover:border-accent-600'
            } ${modoCorreccion ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={modoCorreccion}
          >
            <h3 className="font-semibold text-primary-950">
              {servicio.nombre}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {servicio.descripcion}
            </p>
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-gray-500">{servicio.vigencia}</span>
              <span className="font-bold text-accent-600">
                {servicio.costo}
              </span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  if (initializing) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-950"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-950">
          {modoCorreccion ? 'Corregir solicitud devuelta' : 'Nueva Solicitud'}
        </h1>
        <p className="text-gray-600 mt-2">
          {modoCorreccion
            ? 'Actualiza la información solicitada y vuelve a enviar tu expediente a Ventanilla.'
            : 'Proceso paso a paso para crear una nueva solicitud'}
        </p>
      </div>

      {/* Indicador de progreso */}
      <div className="card mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  paso >= step.id
                    ? 'bg-primary-950 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id}
              </div>
              {step.id < steps.length && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    paso > step.id ? 'bg-primary-950' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-4">
          {steps.map((step) => (
            <p key={step.id}>{step.label}</p>
          ))}
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="card mb-6">
        {paso === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary-950 mb-6">
              Selecciona el tipo de servicio
            </h2>
            {serviciosDisponibles}
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary-950 mb-6">
              Tipo de trámite
            </h2>
            <div className="space-y-3">
              {tiposTramite.map((tramite) => (
                <label
                  key={tramite.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-accent-600 ${modoCorreccion ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="id_tipo_tramite"
                    value={tramite.id}
                    checked={formData.id_tipo_tramite === tramite.id.toString()}
                    onChange={handleChange}
                    className="w-4 h-4"
                    disabled={modoCorreccion}
                  />
                  <span className="ml-3 font-medium text-primary-950">
                    {tramite.nombre}
                  </span>
                </label>
              ))}
            </div>

            {(formData.id_tipo_tramite === '2' || formData.id_tipo_tramite === '3' || formData.id_tipo_tramite === '4') && (
              <div className="form-group mt-6">
                <label htmlFor="numero_cidc_anterior" className="form-label">
                  Número CIDC/Permiso anterior
                </label>
                <input
                  id="numero_cidc_anterior"
                  type="text"
                  name="numero_cidc_anterior"
                  className="input-field"
                  value={formData.numero_cidc_anterior}
                  onChange={handleChange}
                  placeholder="Ej: CIDC-2024-00001"
                />
              </div>
            )}

            {(formData.id_tipo_tramite === '3' || formData.id_tipo_tramite === '4') && (
              <div className="form-group">
                <label htmlFor="motivo_detalle" className="form-label">
                  Detalle del motivo
                </label>
                <textarea
                  id="motivo_detalle"
                  name="motivo_detalle"
                  className="input-field"
                  value={formData.motivo_detalle}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Explica brevemente el motivo de la solicitud..."
                />
              </div>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-primary-950">
              Datos y documentos requeridos
            </h2>
            {modoCorreccion && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded">
                Adjunta únicamente los documentos que necesitas reemplazar. Los archivos que no actualices se mantendrán tal como los enviaste.
              </div>
            )}
            {!currentServiceConfig && (
              <p className="text-sm text-gray-600">
                Selecciona un tipo de servicio para continuar.
              </p>
            )}
            {currentServiceConfig && (
              <div className="space-y-6">
                {renderToggles()}
                {currentServiceConfig.sections?.map((section) => (
                  <div key={section.title} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-primary-950">{section.title}</h3>
                      {section.subtitle && (
                        <p className="text-xs text-gray-500">{section.subtitle}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields?.map((field) => renderField(field))}
                    </div>
                  </div>
                ))}

                {visibleDocumentGroups.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-primary-950">Documentos por adjuntar</h3>
                    {visibleDocumentGroups.map((group) => (
                      <div key={group.title} className="border rounded-lg p-4 space-y-3">
                        <p className="font-semibold text-sm text-gray-800">{group.title}</p>
                        {group.documents.map((doc) => renderDocumentInput(doc))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary-950 mb-4">Revision final</h2>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Tipo de servicio:</strong>{' '}
                {tiposServicio.find((s) => s.id === formData.id_tipo_servicio)?.nombre}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Tipo de tramite:</strong>{' '}
                {currentTramite?.nombre}
              </p>
              {formData.numero_cidc_anterior && (
                <p className="text-sm text-gray-600">
                  <strong>CIDC anterior:</strong> {formData.numero_cidc_anterior}
                </p>
              )}
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-primary-950">Datos suministrados</h3>
              {resumenCampos.length > 0 ? (
                <div className="space-y-2">
                  {resumenCampos.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm border-b py-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-primary-950 text-right ml-4">{item.valor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin informacion adicional.</p>
              )}
            </div>

            <div className="card space-y-4">
              <h3 className="font-semibold text-primary-950">Documentos</h3>
              {renderResumenDocumentos() || (
                <p className="text-sm text-gray-500">No se han seleccionado documentos.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={() => setPaso(Math.max(1, paso - 1))}
          disabled={paso === 1}
          className="flex items-center gap-2 px-6 py-3 border-2 border-primary-950 text-primary-950 rounded-lg disabled:opacity-50"
        >
          <FiArrowLeft /> Atrás
        </button>

        {paso < 4 ? (
          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-700"
          >
            Siguiente <FiArrowRight />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? submitLoadingLabel : submitLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default CrearSolicitud
