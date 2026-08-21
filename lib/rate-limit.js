import { createAdminClient } from '@/lib/supabase/admin'

// Rate limiter durable en Postgres (funciona entre instancias serverless de Vercel).
// Devuelve true si la acción está permitida, false si superó el límite.
export async function rateLimit(key, max, windowSeconds) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      // Si el rate limiter falla, no bloqueamos al usuario legítimo, pero lo logueamos.
      console.error('[rate-limit] error:', error.message)
      return true
    }
    return data === true
  } catch (e) {
    console.error('[rate-limit] excepción:', e.message)
    return true
  }
}

// Obtiene la IP del request (Vercel setea x-forwarded-for)
export function getClientIp(headers) {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}
