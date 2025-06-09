'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../utils/supabase/client'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }
      }
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Registration complete!')
      router.push('/auth/login')
    }
  }

  return (
    <form onSubmit={handleSignUp} className="max-w-md mx-auto mt-12 p-6 border rounded-xl shadow space-y-4">
      <h1 className="text-2xl font-bold text-center">Create an Account</h1>

      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="student">I'm a Student</option>
        <option value="teacher">I'm a Teacher</option>
      </select>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  )
}
