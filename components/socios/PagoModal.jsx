'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, AlertCircle, Wallet } from 'lucide-react'
import { registrarPago } from '@/app/(panel)/socios/actions'
import { PERIODOS, LABEL_PERIODO, montoCuota, formatoARS, LABEL_TIPO } from '@/lib/prices'
import { hoyISO } from '@/lib/dates'

function Guardar() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? 'Registrando…' : 'Registrar pago'}
    </button>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'

export default function PagoModal({ socio, onClose }) {
  const [state, formAction] = useActionState(registrarPago, {})
  const [periodo, setPeriodo] = useState(socio?.periodo_pago || 'mensual')

  useEffect(() => {
    if (state?.ok) onClose(true)
  }, [state, onClose])

  const sugerido = montoCuota(socio?.tipo_membresia, periodo)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 inline-flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Registrar pago
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="socio_id" value={socio.id} />
          <input type="hidden" name="tipo_membresia" value={socio.tipo_membresia} />

          <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
            <p className="font-semibold text-gray-800">{socio.nombre}</p>
            <p className="text-xs text-gray-500">{LABEL_TIPO[socio.tipo_membresia]}</p>
          </div>

          {state?.error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Período</span>
            <select
              name="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className={inputCls}
            >
              {PERIODOS.map((p) => (
                <option key={p} value={p}>{LABEL_PERIODO[p]}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Fecha de pago</span>
            <input name="fecha_pago" type="date" required defaultValue={hoyISO()} className={inputCls} />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">
              Importe (sugerido: {formatoARS(sugerido)})
            </span>
            <input name="monto" type="number" defaultValue={sugerido} className={inputCls} />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Método (opcional)</span>
            <input name="metodo" placeholder="Transferencia, efectivo…" className={inputCls} />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <Guardar />
          </div>
        </form>
      </div>
    </div>
  )
}
