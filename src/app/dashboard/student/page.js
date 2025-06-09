'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../utils/supabase/client'

export default function StudentDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      const role = user?.user_metadata?.role

      if (!user || role !== 'student') {
        router.replace('/auth/login')
      }
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-white w-64 p-6 space-y-6 shadow-md fixed inset-y-0 left-0 transform transition-transform duration-300 z-50 md:relative md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:w-60`}>
        <h2 className="text-xl font-bold text-blue-600">Student Menu</h2>
        <nav className="space-y-4 text-gray-700">
          <a href="/dashboard/student" className="block hover:text-blue-600">Dashboard</a>
          <a href="/student/request" className="block hover:text-blue-600">Submit Request</a>
          <a href="/student/matches" className="block hover:text-blue-600">Matched Teacher</a>
          <button onClick={handleLogout} className="text-left text-red-500 hover:text-red-700">Logout</button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} className="fixed inset-0 bg-black opacity-40 z-40 md:hidden" />
      )}

      {/* Main content */}
      <div className="flex-1 ml-0 md:ml-60 p-6">
        <button className="md:hidden mb-4 text-blue-600" onClick={() => setMenuOpen(!menuOpen)}>
          ☰ Menu
        </button>
        <h1 className="text-2xl font-bold mb-4">Welcome to your Student Dashboard</h1>
        <p>This is where you'll see your learning requests, matched teachers, and progress.</p>
      </div>
    </div>
  )
}
