import nodemailer from 'nodemailer'
import { formatoARS, montoCuota, LABEL_TIPO, LABEL_PERIODO } from '@/lib/prices'
import { formatoFecha } from '@/lib/dates'

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Faltan variables SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS)')
  }
  const port = Number(SMTP_PORT || 465)
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return _transporter
}

export function emailConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

// Plantilla HTML para aviso de vencimiento
export function plantillaVencimiento(socio, { vencida = false } = {}) {
  const monto = montoCuota(socio.tipo_membresia, socio.periodo_pago)
  const nombre = (socio.nombre || '').trim()
  const titulo = vencida
    ? 'Tu cuota de SAMPRE está vencida'
    : 'Tu cuota de SAMPRE está por vencer'
  const intro = vencida
    ? `Te escribimos porque tu cuota de socio venció el <strong>${formatoFecha(socio.fecha_vencimiento)}</strong>.`
    : `Te recordamos que tu cuota de socio vence el <strong>${formatoFecha(socio.fecha_vencimiento)}</strong>.`

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:linear-gradient(135deg,#075985,#1e40af);padding:28px 24px;border-radius:12px 12px 0 0">
      <h1 style="color:#fff;margin:0;font-size:20px">SAMPRE</h1>
      <p style="color:#e0f2fe;margin:4px 0 0;font-size:13px">Sociedad Argentina de Medicina Prehospitalaria</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      <h2 style="font-size:18px;margin:0 0 12px">${titulo}</h2>
      <p style="font-size:14px;line-height:1.6">Hola ${nombre},</p>
      <p style="font-size:14px;line-height:1.6">${intro}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
        <tr><td style="padding:6px 0;color:#64748b">Categoría</td><td style="padding:6px 0;text-align:right;font-weight:600">${LABEL_TIPO[socio.tipo_membresia] || socio.tipo_membresia}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Período</td><td style="padding:6px 0;text-align:right;font-weight:600">${LABEL_PERIODO[socio.periodo_pago] || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Importe</td><td style="padding:6px 0;text-align:right;font-weight:600">${formatoARS(monto)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Vencimiento</td><td style="padding:6px 0;text-align:right;font-weight:600">${formatoFecha(socio.fecha_vencimiento)}</td></tr>
      </table>
      <p style="font-size:14px;line-height:1.6">Para regularizar tu cuota o consultar por tu membresía, respondé este correo o contactanos.</p>
      <p style="font-size:13px;color:#64748b;margin-top:24px">Gracias por formar parte de SAMPRE.</p>
    </div>
  </div>`

  return { subject: `${titulo}`, html }
}

export async function enviarEmail({ to, subject, html }) {
  const transporter = getTransporter()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  return transporter.sendMail({ from, to, subject, html })
}
