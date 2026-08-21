'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { X, AlertCircle } from 'lucide-react'
import { crearSocio, actualizarSocio } from '@/app/(panel)/socios/actions'
import { TIPOS_MEMBRESIA, PERIODOS, LABEL_TIPO, LABEL_PERIODO } from '@/lib/prices'

function Guardar({ editando }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear socio'}
    </button>
  )
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'

export default function SocioFormModal({ socio, onClose }) {
  const editando = Boolean(socio?.id)
  const action = editando ? actualizarSocio : crearSocio
  const [state, formAction] = useActionState(action, {})

  useEffect(() => {
    if (state?.ok) onClose(true)
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editando ? 'Editar socio' : 'Nuevo socio'}
          </h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {editando && <input type="hidden" name="id" value={socio.id} />}

          {state?.error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Campo label="Nombre y apellido *">
              <input name="nombre" required defaultValue={socio?.nombre || ''} className={inputCls} />
            </Campo>
            <Campo label="N° de socio">
              <input name="numero_socio" type="number" defaultValue={socio?.numero_socio ?? ''} className={inputCls} />
            </Campo>

            <Campo label="Tipo de membresía">
              <select name="tipo_membresia" defaultValue={socio?.tipo_membresia || 'activo'} className={inputCls}>
                {TIPOS_MEMBRESIA.map((t) => (
                  <option key={t} value={t}>{LABEL_TIPO[t]}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Profesión u ocupación">
              <input name="profesion" defaultValue={socio?.profesion || ''} className={inputCls} />
            </Campo>

            <Campo label="Período de pago">
              <select name="periodo_pago" defaultValue={socio?.periodo_pago || ''} className={inputCls}>
                <option value="">— (sin definir)</option>
                {PERIODOS.map((p) => (
                  <option key={p} value={p}>{LABEL_PERIODO[p]}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Estado">
              <select name="estado" defaultValue={socio?.estado || 'activo'} className={inputCls}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Campo>

            <Campo label="Email">
              <input name="email" type="email" defaultValue={socio?.email || ''} className={inputCls} />
            </Campo>
            <Campo label="Teléfono">
              <input name="telefono" defaultValue={socio?.telefono || ''} className={inputCls} />
            </Campo>

            <Campo label="Lugar de residencia">
              <input name="residencia" defaultValue={socio?.residencia || ''} className={inputCls} />
            </Campo>
            <Campo label="Cargo ocupado">
              <input name="cargo" defaultValue={socio?.cargo || ''} className={inputCls} />
            </Campo>

            <Campo label="Períodos de cargo">
              <input name="periodos_cargo" defaultValue={socio?.periodos_cargo || ''} className={inputCls} />
            </Campo>
            <Campo label="Fecha de ingreso">
              <input name="fecha_ingreso" type="date" defaultValue={socio?.fecha_ingreso || ''} className={inputCls} />
            </Campo>

            <Campo label="Último pago">
              <input name="fecha_ultimo_pago" type="date" defaultValue={socio?.fecha_ultimo_pago || ''} className={inputCls} />
            </Campo>
            <Campo label="Vencimiento de cuota">
              <input name="fecha_vencimiento" type="date" defaultValue={socio?.fecha_vencimiento || ''} className={inputCls} />
            </Campo>
          </div>

          <Campo label="Notas">
            <textarea name="notas" rows={2} defaultValue={socio?.notas || ''} className={inputCls} />
          </Campo>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <Guardar editando={editando} />
          </div>
        </form>
      </div>
    </div>
  )
}
