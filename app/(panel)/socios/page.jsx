import { createClient } from '@/lib/supabase/server'
import SociosClient from '@/components/socios/SociosClient'

export const dynamic = 'force-dynamic'

export default async function SociosPage() {
  const supabase = await createClient()
  const { data: socios } = await supabase
    .from('socios')
    .select('*')
    .order('numero_socio', { ascending: true, nullsFirst: false })

  return <SociosClient socios={socios || []} />
}
