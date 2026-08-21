'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LogIn, AlertCircle } from 'lucide-react'
import { login } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? 'Ingresando…' : (<><LogIn className="w-4 h-4" /> Ingresar</>)}
    </button>
  )
}

function LoginForm() {
  const [state, formAction] = useActionState(login, {})
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect} />

      {state?.error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="example@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-800 to-secondary-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl p-3 mb-4 shadow-lg">
            <img src="/logo-sampre.png" alt="SAMPRE" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">SAMPRE · Socios</h1>
          <p className="text-white/80 text-sm mt-1">Panel de administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={<div className="text-sm text-gray-500">Cargando…</div>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          Acceso restringido. Todos los accesos quedan registrados.
        </p>
      </div>
    </main>
  )
}
