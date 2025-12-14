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

const emailEnabled = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;

if (emailEnabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  transporter.verify().catch((error) => {
    console.error('No se pudo verificar el transporte SMTP:', error.message);
  });
} else {
  console.warn('[EmailService] SMTP no configurado. Los correos no serán enviados.');
}

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
  if (!emailEnabled || !transporter) {
    console.info('[EmailService] Correo omitido (modo desarrollo):', { to, subject });
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text
  });
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
    await sendEmail({
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

    await sendEmail({
      to,
      subject: 'Activación de cuenta interna MSP',
      html: buildConfirmationHtml(nombre, link, mensajeExtra),
      text: `Hola ${nombre || 'usuario'}, activa tu cuenta interna ingresando a: ${link}. Tu contraseña temporal es: ${tempPassword}`
    });
  },

  async sendPasswordResetEmail({ to, nombre, token, tipo }) {
    const link = buildFrontendLink(`/restablecer-contrasena?token=${encodeURIComponent(token)}&tipo=${tipo}`);
    await sendEmail({
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
