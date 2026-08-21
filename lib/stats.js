import { estadoCuota } from '@/lib/dates'
import { paga } from '@/lib/prices'

// Calcula los KPIs del dashboard a partir de socios y pagos.
export function calcularStats(socios, pagos, { diasAviso = 7 } = {}) {
  const totalSocios = socios.length
  const porTipo = { fundador: 0, titular: 0, activo: 0 }
  const activos = socios.filter((s) => s.estado === 'activo').length
  const inactivos = totalSocios - activos

  for (const s of socios) {
    if (porTipo[s.tipo_membresia] != null) porTipo[s.tipo_membresia]++
  }

  // Recaudación
  const recaudacionTotal = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0)
  const anioActual = new Date().getUTCFullYear()
  const recaudacionAnio = pagos
    .filter((p) => String(p.fecha_pago || '').slice(0, 4) === String(anioActual))
    .reduce((acc, p) => acc + Number(p.monto || 0), 0)

  // Estado de cuotas (solo socios que pagan: activo/titular)
  let alDia = 0
  let porVencer = 0
  let vencidas = 0
  let sinDatos = 0
  const soc008 = socios.filter((s) => paga(s.tipo_membresia) && s.estado === 'activo')

  const listaPorVencer = []
  const listaVencidas = []

  for (const s of soc008) {
    const { estado, dias } = estadoCuota(s.fecha_vencimiento, diasAviso)
    if (estado === 'al_dia') alDia++
    else if (estado === 'por_vencer') {
      porVencer++
      listaPorVencer.push({ ...s, _dias: dias })
    } else if (estado === 'vencida') {
      vencidas++
      listaVencidas.push({ ...s, _dias: dias })
    } else sinDatos++
  }

  listaPorVencer.sort((a, b) => a._dias - b._dias)
  listaVencidas.sort((a, b) => a._dias - b._dias)

  return {
    totalSocios,
    porTipo,
    activos,
    inactivos,
    recaudacionTotal,
    recaudacionAnio,
    anioActual,
    cuotas: { alDia, porVencer, vencidas, sinDatos, totalQuePagan: soc008.length },
    listaPorVencer,
    listaVencidas,
  }
}
