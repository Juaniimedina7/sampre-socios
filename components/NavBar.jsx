'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/socios', label: 'Socios', icon: Users },
]

export default function NavBar({ email }) {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-sampre.png" alt="SAMPRE" className="h-9 w-auto object-contain" />
            <div className="leading-tight border-l border-gray-200 pl-2">
              <p className="font-bold text-gray-900 text-sm">Socios</p>
              <p className="text-[11px] text-gray-500">Panel de gestión</p>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {links.map((l) => {
              const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  {l.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs text-gray-500">{email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </div>

      {/* nav mobile */}
      <nav className="sm:hidden flex items-center gap-1 px-4 pb-2">
        {links.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                active ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
