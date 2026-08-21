import { createAdminClient } from '@/lib/supabase/admin'
import { plantillaVencimiento, enviarEmail, emailConfigurado } from '@/lib/email'
import { estadoCuota, hoyISO, diasHasta } from '@/lib/dates'
import { paga } from '@/lib/prices'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DIAS_AVISO = Number(process.env.DIAS_AVISO_VENCIMIENTO || 7)
// No reenviar el mismo aviso si ya se envió hace menos de N días
const THROTTLE_DIAS = 3

function autorizado(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const url = new URL(request.url)
  return url.searchParams.get('secret') === secret
}

export async function GET(request) {
  if (!autorizado(request)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!emailConfigurado()) {
    return Response.json(
      { ok: false, motivo: 'SMTP no configurado. Configurá SMTP_HOST/USER/PASS.' },
      { status: 200 }
    )
  }

  const admin = createAdminClient()
  const { data: socios, error } = await admin
    .from('socios')
    .select('*')
    .eq('estado', 'activo')
    .not('email', 'is', null)
    .not('fecha_vencimiento', 'is', null)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const hoy = hoyISO()
  const candidatos = (socios || []).filter((s) => {
    if (!paga(s.tipo_membresia)) return false
    const { estado } = estadoCuota(s.fecha_vencimiento, DIAS_AVISO)
    if (estado !== 'por_vencer' && estado !== 'vencida') return false
    // throttle
    if (s.fecha_ultimo_aviso) {
      const d = diasHasta(s.fecha_ultimo_aviso) // negativo = pasado
      if (d != null && Math.abs(d) < THROTTLE_DIAS) return false
    }
    return true
  })

  const resultados = { enviados: 0, errores: 0, detalle: [] }

  for (const s of candidatos) {
    const vencida = estadoCuota(s.fecha_vencimiento).estado === 'vencida'
    try {
      const { subject, html } = plantillaVencimiento(s, { vencida })
      await enviarEmail({ to: s.email, subject, html })
      await admin.from('socios').update({ fecha_ultimo_aviso: hoy }).eq('id', s.id)
      resultados.enviados++
      resultados.detalle.push({ socio: s.nombre, email: s.email, estado: vencida ? 'vencida' : 'por_vencer' })
    } catch (e) {
      resultados.errores++
      resultados.detalle.push({ socio: s.nombre, error: e.message })
    }
  }

  return Response.json({ ok: true, fecha: hoy, candidatos: candidatos.length, ...resultados })
}
