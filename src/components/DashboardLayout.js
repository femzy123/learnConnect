'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'

export default function DashboardLayout({ children, role, menu }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      const userRole = user?.user_metadata?.role

      if (!user || userRole !== role) {
        router.replace('/login')
      }
    }

    checkUser()
  }, [router, role])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white w-64 p-6 space-y-6 shadow-md fixed inset-y-0 left-0 transform transition-transform duration-300 z-50 md:relative md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:w-60`}>
        <h2 className="text-xl font-bold text-blue-600 capitalize">{role} Menu</h2>
        <nav className="space-y-4 text-gray-700">
          {menu.map((item) => (
            <Link key={item.href} href={item.href} className="block hover:text-blue-600">
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-left text-red-500 hover:text-red-700">Logout</button>
        </nav>
      </aside>

      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black opacity-40 z-40 md:hidden" />
      )}

      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-60 p-6">
        <button className="md:hidden mb-4 text-blue-600" onClick={() => setMenuOpen(!menuOpen)}>
          ☰ Menu
        </button>
        {children}
      </div>
    </div>
  )
}
