'use client'

import { useMemo, useState } from 'react'
import {
  Search, Plus, Download, Pencil, Wallet, Users as UsersIcon,
} from 'lucide-react'
import SocioFormModal from './SocioFormModal'
import PagoModal from './PagoModal'
import { AvisoButton, DeleteButton } from './RowActions'
import { LABEL_TIPO, LABEL_PERIODO, paga } from '@/lib/prices'
import { estadoCuota, formatoFecha } from '@/lib/dates'

const DIAS_AVISO = 7

const badgeTipo = {
  fundador: 'bg-amber-100 text-amber-700',
  titular: 'bg-primary-100 text-primary-700',
  activo: 'bg-secondary-100 text-secondary-700',
}

function CuotaBadge({ socio }) {
  if (!paga(socio.tipo_membresia)) {
    return <span className="text-xs text-gray-400">Honorario</span>
  }
  const { estado, dias } = estadoCuota(socio.fecha_vencimiento, DIAS_AVISO)
  const map = {
    al_dia: { cls: 'bg-emerald-100 text-emerald-700', txt: 'Al día' },
    por_vencer: { cls: 'bg-amber-100 text-amber-700', txt: `Vence en ${dias}d` },
    vencida: { cls: 'bg-red-100 text-red-700', txt: `Vencida ${Math.abs(dias)}d` },
    sin_datos: { cls: 'bg-gray-100 text-gray-500', txt: 'Sin datos' },
  }
  const m = map[estado]
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-block w-fit text-xs font-medium px-2 py-0.5 rounded-full ${m.cls}`}>{m.txt}</span>
      {socio.fecha_vencimiento && (
        <span className="text-[11px] text-gray-400">{formatoFecha(socio.fecha_vencimiento)}</span>
      )}
    </div>
  )
}

export default function SociosClient({ socios }) {
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [cuota, setCuota] = useState('todas')
  const [formSocio, setFormSocio] = useState(null) // objeto socio (edit) o {} (nuevo)
  const [showForm, setShowForm] = useState(false)
  const [pagoSocio, setPagoSocio] = useState(null)

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    return socios.filter((s) => {
      if (tipo !== 'todos' && s.tipo_membresia !== tipo) return false
      if (cuota !== 'todas') {
        if (!paga(s.tipo_membresia)) return false
        const { estado } = estadoCuota(s.fecha_vencimiento, DIAS_AVISO)
        if (cuota !== estado) return false
      }
      if (!term) return true
      return [s.nombre, s.email, s.profesion, s.residencia, s.telefono, String(s.numero_socio ?? '')]
        .some((v) => (v || '').toLowerCase().includes(term))
    })
  }, [socios, q, tipo, cuota])

  function onCloseForm(refresh) {
    setShowForm(false)
    setFormSocio(null)
    // el revalidatePath del server action refresca los datos automáticamente
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Socios</h1>
          <p className="text-sm text-gray-500">{socios.length} socios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/socios/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Exportar Excel
          </a>
          <button
            onClick={() => { setFormSocio(null); setShowForm(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Nuevo socio
          </button>
        </div>
      </div>

      {/* Toolbar de filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, profesión…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="todos">Todas las categorías</option>
          <option value="fundador">Fundador</option>
          <option value="titular">Titular</option>
          <option value="activo">Activo</option>
        </select>
        <select value={cuota} onChange={(e) => setCuota(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="todas">Cualquier cuota</option>
          <option value="al_dia">Al día</option>
          <option value="por_vencer">Por vencer</option>
          <option value="vencida">Vencida</option>
          <option value="sin_datos">Sin datos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Profesión</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Cuota</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{s.numero_socio ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{s.nombre}</p>
                    {s.residencia && <p className="text-xs text-gray-400">{s.residencia}</p>}
                    {s.estado === 'inactivo' && (
                      <span className="text-[11px] text-red-500 font-medium">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeTipo[s.tipo_membresia]}`}>
                      {LABEL_TIPO[s.tipo_membresia]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.profesion || '—'}</td>
                  <td className="px-4 py-3">
                    {s.email ? <p className="text-gray-700">{s.email}</p> : <p className="text-gray-300">—</p>}
                    {s.telefono && <p className="text-xs text-gray-400">{s.telefono}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.periodo_pago ? LABEL_PERIODO[s.periodo_pago] : '—'}</td>
                  <td className="px-4 py-3"><CuotaBadge socio={s} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      {paga(s.tipo_membresia) && (
                        <button
                          onClick={() => setPagoSocio(s)}
                          title="Registrar pago"
                          className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                      )}
                      <AvisoButton socio={s} />
                      <button
                        onClick={() => { setFormSocio(s); setShowForm(true) }}
                        title="Editar"
                        className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <DeleteButton socio={s} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No se encontraron socios con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <SocioFormModal socio={formSocio} onClose={onCloseForm} />}
      {pagoSocio && <PagoModal socio={pagoSocio} onClose={() => setPagoSocio(null)} />}
    </div>
  )
}
