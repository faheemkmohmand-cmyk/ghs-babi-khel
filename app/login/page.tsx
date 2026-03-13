'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill all fields'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

      if (loginError) {
        setError('Login failed: ' + loginError.message)
        setLoading(false)
        return
      }

      // Get role then hard redirect
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()

      const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
      window.location.href = dest

    } catch (e: any) {
      setError('Error: ' + e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
          <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-black text-slate-800 mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">Access your school portal</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com" autoComplete="email"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" autoComplete="current-password"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all">
              {loading ? '⏳ Signing in...' : '🚀 Sign In'}
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
