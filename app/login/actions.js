'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function login(prevState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const redirectTo = String(formData.get('redirect') || '/')

  if (!email || !password) {
    return { error: 'Ingresá email y contraseña.' }
  }

  const hdrs = await headers()
  const ip = getClientIp(hdrs)

  // Rate limit por IP: 5 intentos cada 15 minutos
  const okIp = await rateLimit(`login:ip:${ip}`, 5, 15 * 60)
  // Rate limit por email: 5 intentos cada 15 minutos
  const okEmail = await rateLimit(`login:email:${email}`, 5, 15 * 60)

  if (!okIp || !okEmail) {
    return {
      error: 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email o contraseña incorrectos.' }
  }

  // Redirige solo a rutas internas (evita open redirect)
  const safe = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'
  redirect(safe)
}
