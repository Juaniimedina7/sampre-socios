import Link from 'next/link'
import {
  Users, UserCheck, Wallet, CalendarClock, AlertTriangle,
  TrendingUp, Crown, Star, CircleUser, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { calcularStats } from '@/lib/stats'
import { formatoARS, LABEL_TIPO } from '@/lib/prices'
import { formatoFecha } from '@/lib/dates'

export const dynamic = 'force-dynamic'

const DIAS_AVISO = Number(process.env.DIAS_AVISO_VENCIMIENTO || 7)

function StatCard({ icon: Icon, label, value, sub, tone = 'primary' }) {
  const tones = {
    primary: 'from-primary-600 to-primary-700',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    slate: 'from-slate-600 to-slate-700',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tones[tone]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mt-3">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: socios }, { data: pagos }] = await Promise.all([
    supabase.from('socios').select('*'),
    supabase.from('pagos').select('monto, fecha_pago'),
  ])

  const s = calcularStats(socios || [], pagos || [], { diasAviso: DIAS_AVISO })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen general de socios y cuotas</p>
        </div>
        <Link
          href="/socios"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          Ver socios <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total de socios" value={s.totalSocios} sub={`${s.activos} activos · ${s.inactivos} inactivos`} tone="primary" />
        <StatCard icon={Wallet} label="Recaudación total" value={formatoARS(s.recaudacionTotal)} sub="Todos los pagos registrados" tone="green" />
        <StatCard icon={TrendingUp} label={`Recaudación ${s.anioActual}`} value={formatoARS(s.recaudacionAnio)} sub="Pagos del año en curso" tone="slate" />
        <StatCard icon={UserCheck} label="Cuotas al día" value={s.cuotas.alDia} sub={`de ${s.cuotas.totalQuePagan} que pagan cuota`} tone="green" />
      </div>

      {/* Segunda fila: alertas + tipos */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tipos de socio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Socios por categoría</h2>
          <div className="space-y-3">
            <TipoRow icon={Crown} label="Fundador" value={s.porTipo.fundador} total={s.totalSocios} color="bg-amber-500" />
            <TipoRow icon={Star} label="Titular" value={s.porTipo.titular} total={s.totalSocios} color="bg-primary-600" />
            <TipoRow icon={CircleUser} label="Activo" value={s.porTipo.activo} total={s.totalSocios} color="bg-secondary-500" />
          </div>
          <p className="text-xs text-gray-400 mt-4">Los socios Fundadores son honorarios (no pagan cuota).</p>
        </div>

        {/* Cuotas por vencer */}
        <AlertCard
          title="Cuotas por vencer"
          icon={CalendarClock}
          tone="amber"
          count={s.cuotas.porVencer}
          subtitle={`Próximos ${DIAS_AVISO} días`}
          items={s.listaPorVencer}
          emptyText="No hay cuotas por vencer."
        />

        {/* Cuotas vencidas */}
        <AlertCard
          title="Cuotas vencidas"
          icon={AlertTriangle}
          tone="red"
          count={s.cuotas.vencidas}
          subtitle="Requieren gestión"
          items={s.listaVencidas}
          emptyText="No hay cuotas vencidas. 🎉"
        />
      </div>
    </div>
  )
}

function TipoRow({ icon: Icon, label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="inline-flex items-center gap-2 text-gray-700">
          <Icon className="w-4 h-4 text-gray-400" /> {label}
        </span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AlertCard({ title, icon: Icon, tone, count, subtitle, items, emptyText }) {
  const tones = {
    amber: { badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
    red: { badge: 'bg-red-100 text-red-700', icon: 'text-red-500' },
  }
  const t = tones[tone]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
          <Icon className={`w-4 h-4 ${t.icon}`} /> {title}
        </h2>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.badge}`}>{count}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.slice(0, 6).map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.nombre}</p>
                <p className="text-xs text-gray-400">{LABEL_TIPO[s.tipo_membresia]} · vence {formatoFecha(s.fecha_vencimiento)}</p>
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${tone === 'red' ? 'text-red-600' : 'text-amber-600'}`}>
                {s._dias < 0 ? `${Math.abs(s._dias)}d atrás` : `en ${s._dias}d`}
              </span>
            </li>
          ))}
        </ul>
      )}
      {items.length > 6 && (
        <p className="text-xs text-gray-400 mt-2">y {items.length - 6} más…</p>
      )}
    </div>
  )
}
