// Utilidades de fechas (trabajamos con fechas ISO YYYY-MM-DD, sin zona horaria).

export function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export function parseISO(s) {
  if (!s) return null
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d))
}

export function addMonths(iso, months) {
  const d = parseISO(iso)
  if (!d) return null
  const day = d.getUTCDate()
  d.setUTCMonth(d.getUTCMonth() + months)
  // corrige overflow (ej. 31 -> mes sin día 31)
  if (d.getUTCDate() < day) d.setUTCDate(0)
  return d.toISOString().slice(0, 10)
}

// Vencimiento a partir de un pago según el período
export function calcularVencimiento(fechaPagoISO, periodo) {
  if (!fechaPagoISO || !periodo) return null
  return addMonths(fechaPagoISO, periodo === 'anual' ? 12 : 1)
}

// Días entre hoy y una fecha (positivo = futuro, negativo = vencida)
export function diasHasta(iso) {
  const d = parseISO(iso)
  if (!d) return null
  const hoy = parseISO(hoyISO())
  return Math.round((d - hoy) / (1000 * 60 * 60 * 24))
}

export function formatoFecha(iso) {
  const d = parseISO(iso)
  if (!d) return '—'
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// Estado de la cuota de un socio en base a su fecha de vencimiento
export function estadoCuota(fechaVencimientoISO, diasAviso = 7) {
  if (!fechaVencimientoISO) return { estado: 'sin_datos', dias: null }
  const dias = diasHasta(fechaVencimientoISO)
  if (dias < 0) return { estado: 'vencida', dias }
  if (dias <= diasAviso) return { estado: 'por_vencer', dias }
  return { estado: 'al_dia', dias }
}
