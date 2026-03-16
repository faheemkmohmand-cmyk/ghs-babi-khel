'use client'
import { useState } from 'react'
import Link from 'next/link'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
      // Step 1: Sign in
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const authData = await authRes.json()

      if (!authRes.ok || authData.error) {
        setError('Wrong email or password. Please try again.')
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      const accessToken = authData.access_token
      const refreshToken = authData.refresh_token

      // Step 2: Store session so Supabase client can use it
      const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]
      const storageKey = `sb-${projectRef}-auth-token`
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + (authData.expires_in || 3600),
        expires_in: authData.expires_in || 3600,
        token_type: 'bearer',
        user: authData.user,
      }))

      // Step 3: Get role
      let role = 'student'
      try {
        const profileRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${userId}&limit=1`,
          { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${accessToken}` } }
        )
        const profiles = await profileRes.json()
        if (profiles?.[0]?.role) role = profiles[0].role
      } catch (_) {}

      // Step 4: Redirect based on role
      window.location.href = role === 'admin' ? '/admin' : '/dashboard'

    } catch (_) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl">🏫</div>
          <h1 className="font-display text-3xl font-black text-white mb-3">Government High School<br/>Babi Khel</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">Khyber Pakhtunkhwa, Pakistan<br/>Providing quality education since 2018</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              {icon:'🎓',label:'Student Results',sub:'Check your marks'},
              {icon:'🖼️',label:'Gallery',sub:'Photos & events'},
              {icon:'📅',label:'Timetable',sub:'Class schedule'},
              {icon:'📢',label:'Notices',sub:'School updates'},
            ].map(f=>(
              <div key={f.label} className="bg-white/5 border border-white/8 rounded-2xl p-3">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="text-white text-sm font-bold">{f.label}</div>
                <div className="text-white/35 text-xs">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
            <div className="text-xl font-black text-white">GHS Babi Khel</div>
          </div>

          <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-white mb-1">Sign In</h2>
            <p className="text-white/40 text-sm mb-6">Access your school portal</p>

            {error && (
              <div className="bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-5">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="you@email.com" autoComplete="email" disabled={loading}
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 transition-all disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="Your password" autoComplete="current-password" disabled={loading}
                    className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-green-400/50 transition-all disabled:opacity-50"/>
                  <button type="button" onClick={()=>setShowPass(v=>!v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-sm font-bold">
                    {showPass?'Hide':'Show'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg mt-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</>
                  : <><span>🚀</span> Sign In</>}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/8 space-y-3 text-center text-sm">
              <p className="text-white/35">No account?{' '}
                <Link href="/signup" className="text-green-400 font-bold hover:text-green-300">Create one →</Link>
              </p>
              <Link href="/" className="block text-white/20 text-xs hover:text-white/40">← Back to School Website</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
