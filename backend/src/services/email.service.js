import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = 'Ventanilla MSP <noreply@sustanciascontroladas.gob.do>',
  EMAIL_LINK_BASE_URL,
  APP_BASE_URL,
  API_BASE_URL
} = process.env;

const emailEnabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const parseCandidatePorts = () => {
  const envPorts = String(SMTP_PORT || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value) && value > 0);
  const fallbackPorts = [2525, 587, 25, 465];
  return [...new Set([...envPorts, ...fallbackPorts])];
};

const createTransporter = async () => {
  if (!emailEnabled) {
    console.warn('[EmailService] SMTP no configurado. Los correos no serán enviados.');
    return null;
  }

  const candidatePorts = parseCandidatePorts();

  for (const port of candidatePorts) {
    try {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      await transport.verify();
      console.info(`[EmailService] Transporte SMTP verificado en puerto ${port}`);
      return transport;
    } catch (error) {
      console.error(`[EmailService] No se pudo verificar el transporte SMTP en puerto ${port}: ${error.message}`);
    }
  }

  console.error('[EmailService] Ninguno de los puertos SMTP respondió. Los correos quedarán deshabilitados.');
  return null;
};

let transporterPromise = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  const transporter = await transporterPromise;
  if (!transporter) {
    transporterPromise = null;
  }
  return transporter;
};

const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const baseUrl = normalizeBaseUrl(
  EMAIL_LINK_BASE_URL || APP_BASE_URL || API_BASE_URL || 'http://localhost:5000'
);

const buildFrontendLink = (path) => {
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = await getTransporter();

  if (!emailEnabled || !transport) {
    console.info('[EmailService] Correo omitido (sin transporte SMTP):', { to, subject });
    return { success: false, skipped: true };
  }

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text
    });
    return { success: true };
  } catch (error) {
    console.error('[EmailService] No se pudo enviar el correo:', error.message);
    return { success: false, error };
  }
};

const buildConfirmationHtml = (nombre, link, mensajeExtra = '') => `
  <p>Hola ${nombre || 'usuario'},</p>
  <p>Necesitamos que confirmes tu identidad haciendo clic en el siguiente enlace:</p>
  <p><a href="${link}" target="_blank">Confirmar mi cuenta</a></p>
  <p>Si el enlace no funciona, copia y pega esta URL en tu navegador:</p>
  <p>${link}</p>
  ${mensajeExtra ? `<p>${mensajeExtra}</p>` : ''}
  <p>Si no solicitaste este acceso, ignora este mensaje.</p>
`;

const EmailService = {
  async sendSolicitanteConfirmation({ to, nombre, token }) {
    const link = buildFrontendLink(`/confirmar?token=${encodeURIComponent(token)}&tipo=solicitante`);
    return sendEmail({
      to,
      subject: 'Confirma tu cuenta en Ventanilla MSP',
      html: buildConfirmationHtml(nombre, link),
      text: `Hola ${nombre || 'usuario'}, confirma tu cuenta ingresando a: ${link}`
    });
  },

  async sendEmpleadoConfirmation({ to, nombre, token, tempPassword }) {
    const link = buildFrontendLink(`/activar-empleado?token=${encodeURIComponent(token)}&tipo=empleado`);
    const mensajeExtra = tempPassword
      ? `Tu contraseña temporal es: <strong>${tempPassword}</strong>. Deberás cambiarla al iniciar sesión.`
      : '';

    return sendEmail({
      to,
      subject: 'Activación de cuenta interna MSP',
      html: buildConfirmationHtml(nombre, link, mensajeExtra),
      text: `Hola ${nombre || 'usuario'}, activa tu cuenta interna ingresando a: ${link}. Tu contraseña temporal es: ${tempPassword}`
    });
  },

  async sendPasswordResetEmail({ to, nombre, token, tipo }) {
    const link = buildFrontendLink(`/restablecer-contrasena?token=${encodeURIComponent(token)}&tipo=${tipo}`);
    return sendEmail({
      to,
      subject: 'Restablece tu contraseña',
      html: `
        <p>Hola ${nombre || 'usuario'},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el enlace:</p>
        <p><a href="${link}" target="_blank">Restablecer contraseña</a></p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
      text: `Hola ${nombre || 'usuario'}, restablece tu contraseña ingresando a: ${link}`
    });
  }
};

export default EmailService;