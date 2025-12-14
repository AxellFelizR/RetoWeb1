export const getRutaInicioEmpleado = (rol = '') => {
  const rolNormalizado = (rol || '').toUpperCase()

  switch (rolNormalizado) {
    case 'ADMIN':
      return '/admin'
    case 'VENTANILLA':
      return '/bandeja/ventanilla'
    case 'TECNICO_UPC':
    case 'ENCARGADO_UPC':
      return '/bandeja/upc'
    case 'DIRECCION':
      return '/bandeja/direccion'
    case 'DNCD':
      return '/bandeja/dncd'
    default:
      return '/bandeja/ventanilla'
  }
}
