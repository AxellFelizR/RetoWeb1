# Sistema de Gestión de Sustancias Controladas - República Dominicana

### Partes

- **Frontend (React + Vite):** Pantallas para solicitantes y empleados, bandejas por rol y visualización del certificado final.
- **Backend (Node + Express + SQL Server):** API REST con autenticación JWT, flujos de estados, carga de archivos y generación/envío de certificados.
- **Database (SQL Server):** Esquema normalizado con historial completo y catálogos de servicios/sustancias.

### Roles y lo que ven
| Rol | Responsabilidad principal |
|-----|---------------------------|
| Solicitante | Crear solicitudes, subir soportes, descargar certificado emitido. |
| Ventanilla | Revisión documental inicial y devoluciones. |
| Técnico UPC | Analiza la parte técnica y recomienda aprobar/denegar. |
| Encargado UPC | Valida lo técnico y decide si pasa a Dirección. |
| Dirección | Firma y envía a DNCD (o notifica rechazo). |
| DNCD | Revisa permisos de importación y libera el certificado al solicitante. |
| Admin | Gestiona usuarios, catálogos y auditoría. |

### Levantar ambiente local (5 pasos)
1. Crea `.env` en `backend/` con tus credenciales de SQL Server.
2. Ejecuta el script `database/schema_sqlserver.sql` en tu instancia para crear tablas y catálogos.
3. En `backend/`: `npm install` y `npm run dev` → API en `http://localhost:5000`.
4. En `frontend/`: `npm install` y `npm run dev` → SPA en `http://localhost:3000` (o `5173`).
5. Para crear admin primeramente se tiene que hacer "node create-admin.js".
6. Regístrate como solicitante desde la UI o usa los usuarios sembrados para probar roles internos.

### Flujo resumido de una solicitud
1. **Solicitante** completa el formulario y adjunta documentos.
2. **Ventanilla** valida archivos/campos, puede devolver para correcciones.
3. **Técnico UPC** revisa lo técnico y envía al Encargado (o recomienda rechazo).
4. **Encargado UPC** decide si pasa a Dirección o se deniega.
5. **Dirección** firma y manda a **DNCD** cuando aplica (importaciones).
6. **DNCD** emite la no objeción y el sistema marca `CERTIFICADO_EMITIDO`; el solicitante descarga el PDF firmado.

> Si en la pantalla del solicitante aparece el mensaje “Estamos finalizando la publicación del certificado”, significa que aún no existe el registro en `certificado_emitido`. En cuanto DNCD confirme y se guarde el PDF oficial, la descarga estará disponible automáticamente.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                     │
│  • Login/Registro de solicitantes y empleados               │
│  • Dashboard y wizard de solicitudes                        │
│  • Bandejas de trabajo por rol                              │
│  • Gestión de documentos y estado en tiempo real            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│  • Autenticación por JWT                                    │
│  • Autorización por roles                                   │
│  • Gestión de flujo de solicitudes                          │
│  • API REST con validaciones                                │
└────────────────────-────────────────────────────────────────┘
```

---

## Stack y Librerías Clave

### Backend (Node.js + Express)

| Tecnología / Librería | Dónde se usa | Rol clave |
|-----------------------|--------------|-----------|
| **Express 4** | `backend/src/server.js`, rutas en `src/routes` | API REST modular con middleware para auth, validación y manejo de errores. |
| **mssql / tedious** | `backend/src/database/sqlserver.js` y repositorios SQL Server | Pool de conexiones, ejecución de stored queries y soporte para transacciones/TVP en SQL Server. |
| **JWT (jsonwebtoken)** | `middleware/auth.middleware.js` | Autenticación stateless y propagación de claims (rol, id, unidad). |
| **bcryptjs** | `services/auth.service.js` | Hashing y verificación de contraseñas con salting. |
| **Joi** | `controllers/auth.controller.js`, `services/solicitud.service.js` | Validación declarativa de payloads antes de llegar a la capa de negocio. |
| **Multer** | `routes/archivos.routes.js` | Subida de archivos físicos (PDF/JPG/DOC) con límites de 50 MB y persistencia en `uploads/`. |
| **Helmet + express-rate-limit + cors** | `server.js` | Endurecimiento de cabeceras, control de orígenes y protección antifuerza bruta. |
| **Node-cron** | `src/services` (tareas programadas) | Programación de limpiezas y recordatorios automáticos. |
| **Nodemailer & PDFKit** | `services/certificados.service.js`, `controllers/certificados.controller.js` | Generación de certificados firmados y envío de notificaciones por correo. |
| **Axios (server-side)** | `services/pago.service.js` | Integraciones externas (pasarelas, verificación). |

### Frontend (React + Vite)

| Tecnología / Librería | Dónde se usa | Rol clave |
|-----------------------|--------------|-----------|
| **React 18** | `frontend/src` | SPA con componentes reutilizables para solicitantes y empleados. |
| **React Router DOM 6** | `App.jsx` | Protege rutas por rol y define los flujos de navegación (wizard, bandejas). |
| **Zustand** | `store/authStore.js` | Gestión ligera de estado global (token, usuario, roles). |
| **Axios** | `services/api.js` | Cliente HTTP con interceptores para tokens y manejo centralizado de errores. |
| **Tailwind CSS** | `index.css`, `tailwind.config.js` | Sistema de diseño consistente y adaptable al branding MSP/DNCD. |
| **React Hot Toast** | Varias páginas | Feedback inmediato en operaciones críticas (validación, estados). |
| **React Icons** | Componentes UI | Iconografía ligera para acciones (ver, descargar, filtros). |
| **date-fns / react-datepicker** | Formularios | Manejo de fechas locales (RD) y selección amigable para vencimientos. |
| **React Multi Select Component** | `CrearSolicitud.jsx` | Selección de múltiples sustancias/categorías en wizard. |
| **Vite + ESLint** | Tooling | Dev server rápido, HMR y calidad consistente del código. |

### Base de Datos

- **SQL Server 2022** con scripts en `database/schema_sqlserver.sql` y migraciones versionadas en `database/migrations` para sincronizar constraints, catálogos y nuevas columnas/estados.
---

### Esquema Normalizado (3FN)

**Entidades principales:**

1. **Usuarios**
   - `solicitante` - Usuarios externos (profesionales, establecimientos, etc.)
   - `profesional` - Datos específicos de profesionales
   - `establecimiento` - Datos de empresas/instituciones
   - `empleado` - Usuarios internos del MSP

2. **Solicitudes**
   - `solicitud` - Solicitud principal
   - `solicitud_sustancia` - Sustancias controladas solicitadas (N:M)
   - `historial_estado_solicitud` - Trazabilidad de cambios
   - `archivo_adjunto` - Documentos adjuntos

3. **Procesos**
   - `pago` - Registros de pago
   - `certificado_emitido` - Certificados/permisos emitidos
   - `certificado_categoria_autorizada` - Categorías autorizadas

4. **Catálogos**
   - `tipo_servicio`
   - `tipo_tramite`
   - `categoria_droga` (II, III, IV)
   - `sustancia_controlada`
   - `estado_solicitud_catalogo`

---

## Backend

### Requisitos
- Node.js 18+
- SQL Server 2019+ (local, Docker o Azure SQL)
- npm o yarn


### Arquitectura de capas

1. **Controllers** - Manejo de peticiones HTTP
2. **Services** - Lógica de negocio
3. **Repositories** - Acceso a datos (queries SQL)
4. **Middleware** - Autenticación, validación, errores
5. **Utils** - Funciones auxiliares

### Componentes y dependencias destacadas

- **Express + Router modular:** Cada archivo en `src/routes` encapsula endpoints por dominio (solicitudes, archivos, bandejas) y aplica middlewares como `verifyToken`, `requireRole`.
- **SQL Server con `mssql`/`tedious`:** Los repositorios en `src/repositories/*.sqlserver.js` usan parámetros tipados, control de transacciones y `OUTER APPLY` para obtener historiales, garantizando compatibilidad con `estadoConstraintManager` y migraciones.
- **Seguridad integral:** `helmet`, `cors` y `express-rate-limit` endurecen el API; `bcryptjs` y `jsonwebtoken` gestionan credenciales, mientras que `Joi` valida cada payload sensible.
- **Gestión documental:** `multer` escribe archivos en `uploads/` y los controladores propagan metadatos hacia SQL Server para trazabilidad.
- **Procesos automáticos:** `node-cron` (recordatorios) y `pdfkit`/`nodemailer` (emisión y envío de certificados) habilitan tareas async sin depender del frontend.
- **Integraciones externas:** `axios` del lado servidor permite consultar servicios fiscales o pasarelas desde `pago.service.js`.


### Tecnologías

- **React 18** - UI library
- **React Router v6** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notificaciones

### Cómo se emplean en la interfaz

- **React Router DOM** define guards por rol en `App.jsx`, conectados a `ProtectedRoute` para redirigir según `user.rol`.
- **Zustand (`store/authStore.js`)** persiste tokens, datos del usuario y helpers como `logout`, evitando Redux y simplificando SSR.
- **Axios (`services/api.js`)** centraliza interceptores de autorización y manejo de respuestas (auto-logout en 401).
- **Tailwind CSS** impulsa los componentes `card`, `btn-primary` y la paleta institucional definida en `tailwind.config.js`.
- **React Hot Toast** brinda comentarios instantáneos en flujos críticos (validación de ventanilla, transiciones de estado, subida de archivos).
- **date-fns / react-datepicker** aseguran que todas las fechas se muestren con formato local `es-DO` y se respeten los límites del trámite.
- **Componentes especializados** como `react-multi-select-component` y `react-icons` mejoran el wizard de sustancias y la UX de las bandejas.el