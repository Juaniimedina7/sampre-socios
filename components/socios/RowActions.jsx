'use client'

import { useActionState, useEffect, useState } from 'react'
import { Mail, Trash2, Loader2, Check } from 'lucide-react'
import { enviarAvisoManual, eliminarSocio } from '@/app/(panel)/socios/actions'

export function AvisoButton({ socio }) {
  const [state, formAction] = useActionState(enviarAvisoManual, {})
  const [flash, setFlash] = useState(null)

  useEffect(() => {
    if (state?.ok) {
      setFlash('ok')
      const t = setTimeout(() => setFlash(null), 2500)
      return () => clearTimeout(t)
    }
    if (state?.error) {
      setFlash('err')
      const t = setTimeout(() => setFlash(null), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  const disabled = !socio.email

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="socio_id" value={socio.id} />
      <SubmitIcon disabled={disabled} flash={flash} title={disabled ? 'Sin email cargado' : 'Enviar aviso de vencimiento'} errorMsg={state?.error} />
    </form>
  )
}

function SubmitIcon({ disabled, flash, title, errorMsg }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={flash === 'err' ? errorMsg : title}
      className={`p-1.5 rounded-md transition-colors ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : flash === 'ok'
          ? 'text-emerald-600'
          : flash === 'err'
          ? 'text-red-500'
          : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
      }`}
    >
      {flash === 'ok' ? <Check className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
    </button>
  )
}

export function DeleteButton({ socio }) {
  return (
    <form
      action={eliminarSocio}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar a ${socio.nombre}? Esta acción no se puede deshacer.`)) {
          e.preventDefault()
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={socio.id} />
      <button
        type="submit"
        title="Eliminar socio"
        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  )
}
