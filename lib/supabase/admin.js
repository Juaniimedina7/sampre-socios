import { createClient } from '@supabase/supabase-js'

// Cliente con service role: SOLO server-side (bypassa RLS).
// Se usa para el rate limiter y el cron de emails.
// Nunca importar esto en un componente cliente.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
