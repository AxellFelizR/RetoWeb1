const ACCEPT_IMAGE_PDF = 'application/pdf,image/*'

export const SERVICIO_FORM_CONFIG = {
  1: {
    slug: 'claseAProfesional',
    resumenPago: 'RD$150',
    sections: [
      {
        title: 'Datos del profesional',
        fields: [
          { name: 'nombre_profesional', label: 'Nombre del profesional', type: 'text', required: true, prefill: 'nombre' },
          { name: 'direccion_postal', label: 'Direccion / correo postal', type: 'textarea', required: true },
          { name: 'cedula_profesional', label: 'Cedula de identidad y electoral', type: 'text', required: true, readOnly: true, prefill: 'cedula' },
          { name: 'exequatur', label: 'Exequatur del profesional', type: 'text', required: true },
          { name: 'numero_colegiatura', label: 'Numero de colegiatura (si aplica)', type: 'text' },
          { name: 'telefono_residencial', label: 'Telefono residencial', type: 'tel' },
          { name: 'telefono_celular', label: 'Telefono celular', type: 'tel', required: true },
          { name: 'lugar_trabajo', label: 'Lugar de trabajo (nombre del centro)', type: 'text', required: true },
          { name: 'email_profesional', label: 'Email de contacto', type: 'email', required: true, prefill: 'email' },
          { name: 'direccion_trabajo', label: 'Direccion del lugar de trabajo', type: 'textarea', required: true },
          { name: 'telefonos_trabajo', label: 'Telefonos del lugar de trabajo', type: 'text', required: true },
          {
            name: 'profesion',
            label: 'Profesion',
            type: 'select',
            required: true,
            options: [
              { label: 'Medicina', value: 'MEDICINA' },
              { label: 'Medicina Veterinaria', value: 'MEDICINA_VETERINARIA' },
              { label: 'Odontologia', value: 'ODONTOLOGIA' },
              { label: 'Otra', value: 'OTRA' }
            ],
            prefill: 'profesion'
          },
          {
            name: 'profesion_otro',
            label: 'Indique otra profesion',
            type: 'text',
            required: true,
            showWhen: { field: 'profesion', equals: 'OTRA' }
          },
          { name: 'estatus_tramite', label: 'Estatus / tipo de tramite', type: 'text', readOnly: true, required: true },
          {
            name: 'categorias_droga',
            label: 'Categorias de drogas controladas solicitadas',
            type: 'checkbox-group',
            required: true,
            options: [
              { label: 'II', value: 'II' },
              { label: 'III', value: 'III' },
              { label: 'IV', value: 'IV' }
            ]
          },
          { name: 'suma_pagar', label: 'Suma a pagar', type: 'text', readOnly: true }
        ]
      }
    ],
    documentGroups: [
      {
        title: 'Documentos - Nueva solicitud',
        appliesTo: ['1'],
        documents: [
          { name: 'cedula_profesional_doc', label: 'Copia de la cedula del profesional', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'titulo_profesional_doc', label: 'Copia del titulo universitario y/o especialidad', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'exequatur_doc', label: 'Copia del exequatur', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'recibo_pago_doc', label: 'Recibo de deposito / comprobante de pago', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      },
      {
        title: 'Documentos - Renovacion',
        appliesTo: ['2'],
        documents: [
          { name: 'cedula_profesional_doc', label: 'Copia de la cedula del profesional', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'certificado_anterior_doc', label: 'Copia del certificado anterior', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'recibo_pago_doc', label: 'Recibo de deposito / comprobante de pago', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      },
      {
        title: 'Documentos - Perdida / duplicado',
        appliesTo: ['3', '4'],
        documents: [
          { name: 'cedula_profesional_doc', label: 'Copia de la cedula del profesional', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'certificacion_perdida_doc', label: 'Certificacion de perdida emitida por la Policia Nacional', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'recibo_pago_doc', label: 'Recibo de deposito / comprobante de pago', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      }
    ]
  },
  2: {
    slug: 'claseBPrivado',
    resumenPago: 'RD$500 por actividad',
    toggles: [
      {
        name: 'huboCambioDirector',
        label: 'Hubo cambio de Director Tecnico / Regente en esta renovacion',
        appliesTo: ['2']
      },
      {
        name: 'empresaTieneEstatutos',
        label: 'La empresa cuenta con estatutos registrados',
        appliesTo: ['1', '2', '3', '4']
      }
    ],
    sections: [
      {
        title: 'Datos del establecimiento privado',
        fields: [
          { name: 'nombre_empresa', label: 'Nombre de la empresa / razon social', type: 'text', required: true },
          { name: 'direccion_establecimiento', label: 'Direccion / correo postal', type: 'textarea', required: true },
          { name: 'email_establecimiento', label: 'Email de contacto', type: 'email', required: true },
          { name: 'rnc', label: 'RNC', type: 'text', required: true },
          { name: 'telefonos_establecimiento', label: 'Telefonos', type: 'text', required: true },
          {
            name: 'actividades_establecimiento',
            label: 'Actividades del establecimiento',
            type: 'checkbox-group',
            required: true,
            options: [
              { label: 'Importadora', value: 'IMPORTADORA' },
              { label: 'Exportadora', value: 'EXPORTADORA' },
              { label: 'Fabricante', value: 'FABRICANTE' },
              { label: 'Distribuidor', value: 'DISTRIBUIDOR' },
              { label: 'Laboratorio analitico', value: 'LABORATORIO_ANALITICO' },
              { label: 'Farmacia', value: 'FARMACIA' },
              { label: 'Clinica privada', value: 'CLINICA_PRIVADA' },
              { label: 'Clinica veterinaria', value: 'CLINICA_VETERINARIA' },
              { label: 'Institucion de ensenanza superior', value: 'ENSENANZA_SUPERIOR' },
              { label: 'Investigacion categoria I', value: 'INVESTIGACION_CAT_I' },
              { label: 'Otra', value: 'OTRA' }
            ]
          },
          { name: 'actividad_otro', label: 'Describa la actividad', type: 'text', showWhen: { field: 'actividades_establecimiento', includes: 'OTRA' } },
          { name: 'estatus_tramite', label: 'Estatus / tipo de tramite', type: 'text', readOnly: true, required: true }
        ]
      },
      {
        title: 'Datos del regente farmaceutico',
        fields: [
          { name: 'nombre_regente', label: 'Nombre del regente', type: 'text', required: true },
          { name: 'direccion_regente', label: 'Direccion', type: 'textarea', required: true },
          { name: 'telefonos_regente', label: 'Telefonos', type: 'text', required: true },
          { name: 'otro_trabajo_regente', label: 'Otro lugar de trabajo', type: 'text' },
          { name: 'cedula_regente', label: 'Cedula', type: 'text', required: true },
          { name: 'exequatur_regente', label: 'Exequatur', type: 'text', required: true },
          {
            name: 'categorias_regente',
            label: 'Categorias solicitadas',
            type: 'checkbox-group',
            required: true,
            options: [
              { label: 'II', value: 'II' },
              { label: 'III', value: 'III' },
              { label: 'IV', value: 'IV' }
            ]
          }
        ]
      },
      {
        title: 'Listado de sustancias',
        fields: [
          { name: 'sustancias_controladas', label: 'Listado / desglose de sustancias controladas', type: 'textarea', required: true }
        ]
      },
      {
        title: 'Datos del administrador o propietario',
        fields: [
          { name: 'nombre_administrador', label: 'Nombre', type: 'text', required: true },
          { name: 'direccion_administrador', label: 'Direccion', type: 'textarea', required: true },
          { name: 'telefonos_administrador', label: 'Telefonos', type: 'text', required: true },
          { name: 'cedula_administrador', label: 'Cedula', type: 'text', required: true },
          { name: 'otro_trabajo_administrador', label: 'Otro lugar de trabajo (opcional)', type: 'text' }
        ]
      },
      {
        title: 'Datos del agente aduanero (si aplica)',
        fields: [
          { name: 'nombre_agente', label: 'Nombre', type: 'text' },
          { name: 'direccion_agente', label: 'Direccion', type: 'textarea' },
          { name: 'telefonos_agente', label: 'Telefonos', type: 'text' },
          { name: 'cedula_agente', label: 'Cedula', type: 'text' },
          { name: 'rnc_agente', label: 'RNC', type: 'text' },
          { name: 'otro_trabajo_agente', label: 'Otro lugar de trabajo (opcional)', type: 'text' }
        ]
      }
    ],
    documentGroups: [
      {
        title: 'Documentos generales',
        documents: [
          { name: 'cedula_representante_doc', label: 'Copia de la cedula del representante legal', accept: ACCEPT_IMAGE_PDF, required: true },
          {
            name: 'cedula_regente_doc',
            label: 'Copia de la cedula del director tecnico / regente',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '1' || (tramiteId === '2' && toggles.huboCambioDirector === true)
          },
          {
            name: 'titulo_regente_doc',
            label: 'Copia del titulo del Director Tecnico',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '1' || (tramiteId === '2' && toggles.huboCambioDirector === true)
          },
          {
            name: 'exequatur_regente_doc',
            label: 'Copia del exequatur del Director Tecnico',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '1' || (tramiteId === '2' && toggles.huboCambioDirector === true)
          },
          { name: 'permiso_apertura_doc', label: 'Permiso de apertura / habilitacion vigente o volante sellado', accept: ACCEPT_IMAGE_PDF, required: true },
          {
            name: 'estatutos_empresa_doc',
            label: 'Copia de los estatutos de la empresa',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => !!toggles.empresaTieneEstatutos
          },
          {
            name: 'certificado_anterior_doc',
            label: 'Copia del certificado anterior',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId) => tramiteId === '2'
          },
          { name: 'recibos_pago_doc', label: 'Recibo de deposito / comprobante por cada actividad (puede adjuntar multiples archivos)', accept: ACCEPT_IMAGE_PDF, multiple: true, required: true }
        ]
      }
    ]
  },
  3: {
    slug: 'claseBPublico',
    resumenPago: 'Exonerado',
    toggles: [
      {
        name: 'huboCambioFarmaceutico',
        label: 'Hubo cambio de farmaceutico responsable en esta renovacion',
        appliesTo: ['2']
      }
    ],
    sections: [
      {
        title: 'Datos de la institucion publica',
        fields: [
          { name: 'nombre_institucion', label: 'Nombre del hospital o institucion', type: 'text', required: true },
          { name: 'tipo_institucion', label: 'Tipo de institucion', type: 'select', required: true, options: [
            { label: 'Hospital publico', value: 'HOSPITAL' },
            { label: 'Institucion oficial', value: 'INSTITUCION' },
            { label: 'Otra', value: 'OTRA' }
          ] },
          { name: 'tipo_institucion_otro', label: 'Describa el tipo de institucion', type: 'text', showWhen: { field: 'tipo_institucion', equals: 'OTRA' } },
          { name: 'direccion_institucion', label: 'Direccion', type: 'textarea', required: true },
          { name: 'email_institucion', label: 'Email de contacto', type: 'email', required: true },
          { name: 'telefonos_institucion', label: 'Telefonos', type: 'text', required: true },
          { name: 'estatus_tramite', label: 'Estatus / tipo de tramite', type: 'text', readOnly: true, required: true }
        ]
      },
      {
        title: 'Representante de la entidad',
        fields: [
          { name: 'nombre_representante', label: 'Nombre', type: 'text', required: true },
          { name: 'cedula_representante', label: 'Cedula', type: 'text', required: true },
          { name: 'cargo_representante', label: 'Cargo', type: 'text', required: true }
        ]
      },
      {
        title: 'Farmaceutico responsable',
        fields: [
          { name: 'nombre_farmaceutico', label: 'Nombre', type: 'text', required: true },
          { name: 'cedula_farmaceutico', label: 'Cedula', type: 'text', required: true },
          { name: 'titulo_farmaceutico', label: 'Titulo', type: 'text', required: true },
          { name: 'exequatur_farmaceutico', label: 'Exequatur', type: 'text', required: true },
          { name: 'telefonos_farmaceutico', label: 'Telefonos', type: 'text', required: true }
        ]
      }
    ],
    documentGroups: [
      {
        title: 'Documentos - Nueva solicitud',
        appliesTo: ['1'],
        documents: [
          { name: 'cedula_rep_doc', label: 'Copia de la cedula del representante de la entidad', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'cedula_farm_doc', label: 'Copia de la cedula del farmaceutico responsable', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'titulo_farm_doc', label: 'Copia del titulo del farmaceutico responsable', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'exequatur_farm_doc', label: 'Copia del exequatur del farmaceutico responsable', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      },
      {
        title: 'Documentos - Renovacion',
        appliesTo: ['2'],
        documents: [
          { name: 'certificado_anterior_doc', label: 'Copia del certificado anterior', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'cedula_rep_doc', label: 'Copia de la cedula del representante de la entidad', accept: ACCEPT_IMAGE_PDF, required: true },
          {
            name: 'cedula_farm_doc',
            label: 'Copia de la cedula del farmaceutico responsable',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '2' && toggles.huboCambioFarmaceutico === true
          },
          {
            name: 'titulo_farm_doc',
            label: 'Copia del titulo del farmaceutico responsable',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '2' && toggles.huboCambioFarmaceutico === true
          },
          {
            name: 'permiso_apertura_doc',
            label: 'Permiso de apertura / habilitacion vigente o volante sellado',
            accept: ACCEPT_IMAGE_PDF,
            required: true
          },
          {
            name: 'exequatur_farm_doc',
            label: 'Copia del exequatur del farmaceutico responsable',
            accept: ACCEPT_IMAGE_PDF,
            requiredWhen: (tramiteId, toggles) => tramiteId === '2' && toggles.huboCambioFarmaceutico === true
          }
        ]
      }
    ]
  },
  4: {
    slug: 'importacionMateriaPrima',
    sections: [
      {
        title: 'Fase I - Datos del importador',
        fields: [
          { name: 'fase1_nombre_importador', label: 'Nombre del laboratorio o distribuidora', type: 'text', required: true },
          { name: 'fase1_direccion_importador', label: 'Direccion', type: 'textarea', required: true },
          { name: 'fase1_telefono_importador', label: 'Telefono', type: 'text', required: true },
          { name: 'fase1_email_importador', label: 'Email', type: 'email', required: true },
          { name: 'fase1_rnc_importador', label: 'RNC', type: 'text', required: true }
        ]
      },
      {
        title: 'Fase I - Datos del exportador',
        fields: [
          { name: 'fase1_pais_exportador', label: 'Pais del exportador', type: 'text', required: true },
          { name: 'fase1_nombre_exportador', label: 'Nombre', type: 'text', required: true },
          { name: 'fase1_direccion_exportador', label: 'Direccion', type: 'textarea', required: true },
          { name: 'fase1_telefono_exportador', label: 'Telefono', type: 'text', required: true },
          { name: 'fase1_email_exportador', label: 'Email', type: 'email', required: true }
        ]
      },
      {
        title: 'Fase I - Detalle de la importacion',
        fields: [
          { name: 'fase1_sustancia', label: 'Sustancia controlada a importar', type: 'text', required: true },
          { name: 'fase1_cantidad', label: 'Cantidad de sustancia', type: 'text', required: true },
          { name: 'fase1_nombre_producto', label: 'Nombre del producto a fabricar', type: 'text' },
          { name: 'fase1_registro_sanitario', label: 'Numero de registro sanitario', type: 'text' },
          { name: 'fase1_puertos', label: 'Puerto de embarque y desembarque', type: 'text', required: true },
          { name: 'fase1_pais_procedencia', label: 'Pais de procedencia', type: 'text', required: true },
          {
            name: 'fase1_via_transporte',
            label: 'Via de transporte',
            type: 'select',
            required: true,
            options: [
              { label: 'Maritima', value: 'MARITIMA' },
              { label: 'Aerea', value: 'AEREA' }
            ]
          }
        ]
      },
      {
        title: 'Fase II - Entregables',
        fields: [
          { name: 'fase2_detalle_factura', label: 'Detalle de factura (lote, vencimiento, importe)', type: 'textarea', required: true },
          { name: 'fase2_comprobante_digemaps', label: 'Numero de comprobante DIGEMAPS', type: 'text' }
        ]
      }
    ],
    documentGroups: [
      {
        title: 'Fase I - Documentos requeridos',
        documents: [
          { name: 'fase1_carta_solicitud_doc', label: 'Carta de solicitud / comunicacion del importador', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase1_factura_proforma_doc', label: 'Factura proforma o comercial de importacion', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase1_factura_proforma_trad_doc', label: 'Traduccion de la factura (si aplica)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase1_carta_dncd_doc', label: 'Carta de autorizacion de sustancia emitida por la DNCD', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      },
      {
        title: 'Fase II - Documentos requeridos',
        documents: [
          { name: 'fase2_permiso_msp_doc', label: 'Permiso de importacion otorgado por MSP-DNCD', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_factura_comercial_doc', label: 'Factura comercial de importacion', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_factura_comercial_trad_doc', label: 'Traduccion de factura comercial (si no esta en espanol)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_certificados_analisis_doc', label: 'Certificados de analisis emitidos por la empresa fabricante', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_certificados_analisis_trad_doc', label: 'Traduccion de certificados de analisis (si aplica)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_certificado_bpm_doc', label: 'Certificado de Buenas Practicas de Manufactura', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_certificado_libre_venta_doc', label: 'Certificado de Libre Venta', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_comprobante_digemaps_doc', label: 'Comprobante de ingreso en DIGEMAPS', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_expediente_juegos_doc', label: 'Cuatro (4) juegos del expediente (zip o pdf)', accept: ACCEPT_IMAGE_PDF, multiple: true }
        ]
      }
    ]
  },
  5: {
    slug: 'importacionMedicamentos',
    sections: [
      {
        title: 'Fase I - Datos del importador',
        fields: [
          { name: 'fase1_med_nombre_importador', label: 'Nombre del importador', type: 'text', required: true },
          { name: 'fase1_med_direccion_importador', label: 'Direccion', type: 'textarea', required: true },
          { name: 'fase1_med_telefono_importador', label: 'Telefono', type: 'text', required: true },
          { name: 'fase1_med_email_importador', label: 'Email', type: 'email', required: true },
          { name: 'fase1_med_rnc_importador', label: 'RNC', type: 'text', required: true }
        ]
      },
      {
        title: 'Fase I - Datos del exportador',
        fields: [
          { name: 'fase1_med_pais_exportador', label: 'Pais del exportador', type: 'text', required: true },
          { name: 'fase1_med_nombre_exportador', label: 'Nombre', type: 'text', required: true },
          { name: 'fase1_med_direccion_exportador', label: 'Direccion', type: 'textarea', required: true },
          { name: 'fase1_med_telefono_exportador', label: 'Telefono', type: 'text', required: true },
          { name: 'fase1_med_email_exportador', label: 'Email', type: 'email', required: true }
        ]
      },
      {
        title: 'Fase I - Detalle del medicamento',
        fields: [
          { name: 'fase1_med_nombre_medicamento', label: 'Nombre del medicamento a importar', type: 'text', required: true },
          { name: 'fase1_med_sustancia', label: 'Sustancia controlada que contiene el medicamento', type: 'text', required: true },
          { name: 'fase1_med_cantidad_medicamento', label: 'Cantidad de medicamento a importar', type: 'text', required: true },
          { name: 'fase1_med_cantidad_sustancia', label: 'Cantidad de sustancia base por unidad y total', type: 'textarea', required: true },
          { name: 'fase1_med_presentacion', label: 'Presentacion del medicamento', type: 'text', required: true },
          { name: 'fase1_med_registro_sanitario', label: 'Numero de registro sanitario del medicamento', type: 'text', required: true },
          { name: 'fase1_med_permiso_claseb', label: 'Numero de permiso Clase B (CIDC) vigente', type: 'text', required: true },
          { name: 'fase1_med_puertos', label: 'Puerto de embarque y desembarque', type: 'text', required: true },
          { name: 'fase1_med_pais_procedencia', label: 'Pais de procedencia', type: 'text', required: true },
          {
            name: 'fase1_med_via_transporte',
            label: 'Via de transporte',
            type: 'select',
            required: true,
            options: [
              { label: 'Maritima', value: 'MARITIMA' },
              { label: 'Aerea', value: 'AEREA' }
            ]
          }
        ]
      },
      {
        title: 'Fase II - Entregables',
        fields: [
          { name: 'fase2_med_detalle_factura', label: 'Detalle de factura comercial (lote, vencimiento, importe)', type: 'textarea', required: true },
          { name: 'fase2_med_visado', label: 'Detalle de visado ARAPF / INFADOMI (si aplica)', type: 'textarea' }
        ]
      }
    ],
    documentGroups: [
      {
        title: 'Fase I - Documentos requeridos',
        documents: [
          { name: 'fase1_med_carta_solicitud_doc', label: 'Carta de solicitud del importador', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase1_med_factura_proforma_doc', label: 'Factura proforma o comercial', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase1_med_factura_proforma_trad_doc', label: 'Traduccion de factura proforma (si aplica)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase1_med_carta_dncd_doc', label: 'Carta de autorizacion de sustancia emitida por la DNCD', accept: ACCEPT_IMAGE_PDF, required: true }
        ]
      },
      {
        title: 'Fase II - Documentos requeridos',
        documents: [
          { name: 'fase2_med_permiso_msp_doc', label: 'Permiso de importacion otorgado por MSP-DNCD', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_med_factura_comercial_doc', label: 'Factura comercial de importacion', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_med_factura_comercial_trad_doc', label: 'Traduccion de factura comercial (si aplica)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_med_factura_sellada_doc', label: 'Factura comercial sellada por la empresa importadora', accept: ACCEPT_IMAGE_PDF, required: true },
          { name: 'fase2_med_visado_doc', label: 'Visado por ARAPF / INFADOMI (si aplica)', accept: ACCEPT_IMAGE_PDF },
          { name: 'fase2_med_expediente_juegos_doc', label: 'Cuatro (4) juegos del expediente', accept: ACCEPT_IMAGE_PDF, multiple: true }
        ]
      }
    ]
  }
}

export default SERVICIO_FORM_CONFIG
