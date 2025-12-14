export const TIPOS_SERVICIO = [
  {
    id: 1,
    nombre: 'Certificado Clase A - Profesional',
    descripcion: 'Para médicos, odontólogos, veterinarios',
    vigencia: '3 años',
    costo: 'RD$150'
  },
  {
    id: 2,
    nombre: 'Certificado Clase B - Establecimientos Privados',
    descripcion: 'Para laboratorios, farmacias, distribuidoras',
    vigencia: '1 año',
    costo: 'RD$500'
  },
  {
    id: 3,
    nombre: 'Certificado Clase B - Instituciones Públicas',
    descripcion: 'Para hospitales y entidades públicas',
    vigencia: '1 año',
    costo: 'Exonerado'
  },
  {
    id: 4,
    nombre: 'Permiso - Importación Materia Prima',
    descripcion: 'Para importación de sustancias controladas',
    vigencia: '180 días',
    costo: 'RD$300'
  },
  {
    id: 5,
    nombre: 'Permiso - Importación Medicamentos',
    descripcion: 'Para importación de medicamentos controlados',
    vigencia: '180 días',
    costo: 'RD$300'
  }
]

export const TIPOS_TRAMITE = [
  { id: 1, nombre: 'Nueva solicitud' },
  { id: 2, nombre: 'Renovación' },
  { id: 3, nombre: 'Solicitud anterior negada' },
  { id: 4, nombre: 'Certificado reprobado/suspendido' }
]

export const TIPOS_SERVICIO_MAP = TIPOS_SERVICIO.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

export const TIPOS_TRAMITE_MAP = TIPOS_TRAMITE.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})
