'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill all fields'); return }
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    toast.success('Welcome! Loading...')

    // Wait for cookie to be set then hard navigate
    await new Promise(r => setTimeout(r, 1000))
    window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
          <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
          <p className="text-white/40 text-sm mt-1">Student & Admin Portal</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-black text-slate-800 mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">Access your school portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                disabled={loading}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                disabled={loading}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-base flex items-center justify-center gap-2">
              {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
              {loading ? 'Signing in...' : '🚀 Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            No account?{' '}
            <Link href="/signup" className="text-green-700 font-bold hover:underline">Create one →</Link>
          </p>
          <Link href="/" className="block text-center text-slate-300 text-xs mt-2 hover:text-slate-500">← Back to website</Link>
        </div>
      </div>
    </div>
  )
}
