import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'

export default async function PanelLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Doble barrera (además del middleware): sin sesión, a login.
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
