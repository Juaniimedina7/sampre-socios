'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TIPOS_MEMBRESIA, PERIODOS, montoCuota, paga } from '@/lib/prices'
import { calcularVencimiento } from '@/lib/dates'
import { plantillaVencimiento, enviarEmail, emailConfigurado } from '@/lib/email'

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return { supabase, user }
}

function str(v) {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

function parseSocio(formData) {
  const tipo = str(formData.get('tipo_membresia'))
  const periodo = str(formData.get('periodo_pago'))
  const numero = str(formData.get('numero_socio'))
  const estado = str(formData.get('estado'))

  return {
    numero_socio: numero ? Number(numero) : null,
    nombre: str(formData.get('nombre')),
    profesion: str(formData.get('profesion')),
    tipo_membresia: TIPOS_MEMBRESIA.includes(tipo) ? tipo : 'activo',
    residencia: str(formData.get('residencia')),
    cargo: str(formData.get('cargo')),
    periodos_cargo: str(formData.get('periodos_cargo')),
    email: str(formData.get('email')),
    telefono: str(formData.get('telefono')),
    periodo_pago: PERIODOS.includes(periodo) ? periodo : null,
    estado: estado === 'inactivo' ? 'inactivo' : 'activo',
    fecha_ingreso: str(formData.get('fecha_ingreso')),
    fecha_ultimo_pago: str(formData.get('fecha_ultimo_pago')),
    fecha_vencimiento: str(formData.get('fecha_vencimiento')),
    notas: str(formData.get('notas')),
  }
}

export async function crearSocio(prevState, formData) {
  const { supabase } = await requireUser()
  const data = parseSocio(formData)
  if (!data.nombre) return { error: 'El nombre es obligatorio.' }

  const { error } = await supabase.from('socios').insert(data)
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un socio con ese número.' }
    return { error: error.message }
  }
  revalidatePath('/socios')
  revalidatePath('/')
  return { ok: true }
}

export async function actualizarSocio(prevState, formData) {
  const { supabase } = await requireUser()
  const id = str(formData.get('id'))
  if (!id) return { error: 'Falta el identificador del socio.' }
  const data = parseSocio(formData)
  if (!data.nombre) return { error: 'El nombre es obligatorio.' }

  const { error } = await supabase.from('socios').update(data).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un socio con ese número.' }
    return { error: error.message }
  }
  revalidatePath('/socios')
  revalidatePath('/')
  return { ok: true }
}

export async function eliminarSocio(formData) {
  const { supabase } = await requireUser()
  const id = str(formData.get('id'))
  if (!id) return
  await supabase.from('socios').delete().eq('id', id)
  revalidatePath('/socios')
  revalidatePath('/')
}

// Registra un pago: inserta en pagos y actualiza fecha_ultimo_pago / fecha_vencimiento del socio
export async function registrarPago(prevState, formData) {
  const { supabase } = await requireUser()
  const socioId = str(formData.get('socio_id'))
  const tipo = str(formData.get('tipo_membresia'))
  const periodo = str(formData.get('periodo'))
  const fechaPago = str(formData.get('fecha_pago'))
  const metodo = str(formData.get('metodo'))
  const montoOverride = str(formData.get('monto'))

  if (!socioId) return { error: 'Falta el socio.' }
  if (!PERIODOS.includes(periodo)) return { error: 'Elegí un período válido.' }
  if (!fechaPago) return { error: 'Ingresá la fecha de pago.' }
  if (!paga(tipo)) return { error: 'Los socios Fundadores no pagan cuota.' }

  const monto = montoOverride ? Number(montoOverride) : montoCuota(tipo, periodo)
  const vencimiento = calcularVencimiento(fechaPago, periodo)

  const { error: e1 } = await supabase.from('pagos').insert({
    socio_id: socioId,
    monto,
    periodo,
    fecha_pago: fechaPago,
    cubre_desde: fechaPago,
    cubre_hasta: vencimiento,
    metodo,
  })
  if (e1) return { error: e1.message }

  const { error: e2 } = await supabase
    .from('socios')
    .update({
      periodo_pago: periodo,
      fecha_ultimo_pago: fechaPago,
      fecha_vencimiento: vencimiento,
    })
    .eq('id', socioId)
  if (e2) return { error: e2.message }

  revalidatePath('/socios')
  revalidatePath('/')
  return { ok: true, vencimiento }
}

// Envía manualmente el aviso de vencimiento a un socio
export async function enviarAvisoManual(prevState, formData) {
  await requireUser()
  const { supabase } = await requireUser()
  const socioId = str(formData.get('socio_id'))
  if (!socioId) return { error: 'Falta el socio.' }
  if (!emailConfigurado()) return { error: 'El email (SMTP) todavía no está configurado.' }

  const { data: socio, error } = await supabase
    .from('socios')
    .select('*')
    .eq('id', socioId)
    .single()
  if (error || !socio) return { error: 'No se encontró el socio.' }
  if (!socio.email) return { error: 'El socio no tiene email cargado.' }

  const vencida = socio.fecha_vencimiento
    ? new Date(socio.fecha_vencimiento) < new Date()
    : false

  try {
    const { subject, html } = plantillaVencimiento(socio, { vencida })
    await enviarEmail({ to: socio.email, subject, html })
    return { ok: true }
  } catch (e) {
    return { error: 'No se pudo enviar el email: ' + e.message }
  }
}
