// Precios de cuota SAMPRE (ARS). Fuente: sampre-landing/app/socios/page.jsx
// Fundador paga igual que Titular.
export const PRECIOS = {
  activo: { mensual: 8000, anual: 60000 },
  titular: { mensual: 10000, anual: 80000 },
  fundador: { mensual: 10000, anual: 80000 },
}

export const TIPOS_MEMBRESIA = ['fundador', 'titular', 'activo']
export const PERIODOS = ['mensual', 'anual']

// Todas las categorías pagan cuota
export const TIPOS_QUE_PAGAN = ['fundador', 'activo', 'titular']

export function montoCuota(tipo, periodo) {
  if (!tipo || !periodo) return 0
  return PRECIOS[tipo]?.[periodo] ?? 0
}

export function paga(tipo) {
  return TIPOS_QUE_PAGAN.includes(tipo)
}

const _fmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatoARS(n) {
  return _fmt.format(Number(n || 0))
}

export const LABEL_TIPO = {
  fundador: 'Fundador',
  titular: 'Titular',
  activo: 'Activo',
}

export const LABEL_PERIODO = {
  mensual: 'Mensual',
  anual: 'Anual',
}
