import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { LABEL_TIPO, LABEL_PERIODO, montoCuota, paga } from '@/lib/prices'
import { estadoCuota } from '@/lib/dates'

export const dynamic = 'force-dynamic'

const ESTADO_LABEL = {
  al_dia: 'Al día',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
  sin_datos: 'Sin datos',
}

export async function GET() {
  const supabase = await createClient()

  // Barrera de seguridad además del middleware
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('No autorizado', { status: 401 })
  }

  const { data: socios } = await supabase
    .from('socios')
    .select('*')
    .order('numero_socio', { ascending: true, nullsFirst: false })

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SAMPRE - Gestión de Socios'
  const ws = wb.addWorksheet('Socios')

  ws.columns = [
    { header: 'N° Socio', key: 'numero_socio', width: 10 },
    { header: 'Nombre y apellido', key: 'nombre', width: 32 },
    { header: 'Profesión', key: 'profesion', width: 16 },
    { header: 'Categoría', key: 'tipo', width: 12 },
    { header: 'Residencia', key: 'residencia', width: 20 },
    { header: 'Cargo', key: 'cargo', width: 28 },
    { header: 'Períodos de cargo', key: 'periodos_cargo', width: 24 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Teléfono', key: 'telefono', width: 18 },
    { header: 'Período pago', key: 'periodo', width: 12 },
    { header: 'Cuota (ARS)', key: 'monto', width: 12 },
    { header: 'Último pago', key: 'fecha_ultimo_pago', width: 14 },
    { header: 'Vencimiento', key: 'fecha_vencimiento', width: 14 },
    { header: 'Estado cuota', key: 'estado_cuota', width: 14 },
    { header: 'Estado socio', key: 'estado', width: 12 },
    { header: 'Notas', key: 'notas', width: 30 },
  ]

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF075985' } }
  ws.getRow(1).alignment = { vertical: 'middle' }

  for (const s of socios || []) {
    const esc = paga(s.tipo_membresia)
      ? ESTADO_LABEL[estadoCuota(s.fecha_vencimiento).estado]
      : 'Honorario'
    ws.addRow({
      numero_socio: s.numero_socio ?? '',
      nombre: s.nombre || '',
      profesion: s.profesion || '',
      tipo: LABEL_TIPO[s.tipo_membresia] || s.tipo_membresia,
      residencia: s.residencia || '',
      cargo: s.cargo || '',
      periodos_cargo: s.periodos_cargo || '',
      email: s.email || '',
      telefono: s.telefono || '',
      periodo: s.periodo_pago ? LABEL_PERIODO[s.periodo_pago] : '',
      monto: paga(s.tipo_membresia) ? montoCuota(s.tipo_membresia, s.periodo_pago) : 0,
      fecha_ultimo_pago: s.fecha_ultimo_pago || '',
      fecha_vencimiento: s.fecha_vencimiento || '',
      estado_cuota: esc,
      estado: s.estado || '',
      notas: s.notas || '',
    })
  }

  ws.autoFilter = { from: 'A1', to: 'P1' }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await wb.xlsx.writeBuffer()
  const fecha = new Date().toISOString().slice(0, 10)

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="socios-sampre-${fecha}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
