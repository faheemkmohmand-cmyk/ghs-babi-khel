'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please fill in both fields.'); return }
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (err || !data.user) { setError('Wrong email or password.'); setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle() as any
      window.location.href = p?.role === 'admin' ? '/admin' : '/dashboard'
    } catch(_) { setError('Something went wrong.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12">
        <div className="text-center max-w-sm">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl">🏫</div>
          <h1 className="font-display text-3xl font-black text-white mb-3">Government High School<br/>Babi Khel</h1>
          <p className="text-white/40 text-sm mb-8">Khyber Pakhtunkhwa, Pakistan<br/>Providing quality education since 2018</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Sign In</h2>
            <p className="text-white/40 text-sm mb-6">Access your school portal</p>
            {error && <div className="bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-5">⚠️ {error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" disabled={loading}
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" disabled={loading}
                    className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-green-400/50 disabled:opacity-50"/>
                  <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-sm font-bold">{showPass?'Hide':'Show'}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</>:<><span>🚀</span> Sign In</>}
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-white/8 text-center text-sm space-y-2">
              <p className="text-white/35">No account? <Link href="/signup" className="text-green-400 font-bold">Create one →</Link></p>
              <Link href="/" className="block text-white/20 text-xs hover:text-white/40">← Back to School Website</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
