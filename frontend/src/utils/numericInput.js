const CONTROL_KEYS = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter']
const SHORTCUT_KEYS = ['a', 'c', 'v', 'x']

const isDigit = (key) => /^\d$/.test(key)
const isShortcutCombo = (event) => (event.ctrlKey || event.metaKey) && SHORTCUT_KEYS.includes(event.key.toLowerCase())

const shouldAllowKey = (event, allowDecimal = false) => {
  if (isDigit(event.key)) return true
  if (CONTROL_KEYS.includes(event.key)) return true
  if (isShortcutCombo(event)) return true
  if (allowDecimal && event.key === '.' && !event.currentTarget.value.includes('.')) {
    return true
  }
  return false
}

export const keepDigitsOnly = (value = '') => value.replace(/\D/g, '')

export const keepDecimalNumber = (value = '') => {
  if (!value) return ''
  const sanitized = value.replace(/[^0-9.]/g, '')
  const [integerPart, ...decimalParts] = sanitized.split('.')
  if (decimalParts.length === 0) {
    return integerPart
  }
  return `${integerPart}.${decimalParts.join('')}`
}

export const preventNonDigitKey = (event) => {
  if (!shouldAllowKey(event, false)) {
    event.preventDefault()
  }
}

export const preventNonDecimalKey = (event) => {
  if (!shouldAllowKey(event, true)) {
    event.preventDefault()
  }
}
