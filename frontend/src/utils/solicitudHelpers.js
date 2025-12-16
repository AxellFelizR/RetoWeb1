export const hasReadableValue = (valor) => {
  if (valor === undefined || valor === null) return false
  if (typeof valor === 'string') return valor.trim().length > 0
  if (Array.isArray(valor)) return valor.length > 0
  return true
}

export const formatValor = (valor) => (Array.isArray(valor) ? valor.join(', ') : valor)

export const buildCamposResumen = (datosServicio, config) => {
  if (!datosServicio) return []
  const items = []

  if (config?.sections) {
    for (const section of config.sections) {
      if (!section.fields) continue
      for (const field of section.fields) {
        const valor = datosServicio[field.name]
        if (!hasReadableValue(valor)) continue
        items.push({ key: field.name, label: field.label, valor: formatValor(valor) })
      }
    }
  }

  if (items.length > 0) {
    return items
  }

  return Object.entries(datosServicio)
    .filter(([, valor]) => hasReadableValue(valor))
    .map(([key, valor]) => ({ key, label: key, valor: formatValor(valor) }))
}

export const parseMontoDesdeLabel = (label) => {
  if (!label) return 0
  const raw = String(label)
    .replace(/[^0-9.,-]/g, '')
    .replace(/,(?=\d{3}(?:[,\.]|$))/g, '')
    .replace(',', '.')

  const monto = Number.parseFloat(raw)
  if (Number.isNaN(monto) || !Number.isFinite(monto)) {
    return 0
  }
  return Math.max(0, monto)
}
