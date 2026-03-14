'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!email.trim())    { setError('Please enter your email'); return }
    if (!password)        { setError('Please enter a password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      })
      if (signUpError) { setError(signUpError.message); return }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
          role: 'student',
        })
        setDone(true)
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-green-900 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
        <h2 className="font-black text-white text-xl mb-2">Account Created!</h2>
        <p className="text-white/50 text-sm mb-6">Your account is ready. Click below to sign in.</p>
        <a href="/login" className="block w-full bg-green-900 hover:bg-green-950 text-white font-bold py-3.5 rounded-xl text-center transition-all">
          Go to Sign In →
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="absolute inset-0 pointer-events-none"
        style={{backgroundImage:'linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)',backgroundSize:'50px 50px'}}/>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xl">🏫</div>
          <h1 className="text-xl font-black text-white" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</h1>
          <p className="text-white/35 text-xs mt-1">School Portal</p>
        </div>

        <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-7">
          <h2 className="text-xl font-black text-white mb-1">Create Account</h2>
          <p className="text-white/35 text-sm mb-6">Join the GHS Babi Khel portal</p>

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)}
                placeholder="Your full name" autoComplete="name" disabled={loading}
                className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 transition-all disabled:opacity-50"/>
            </div>

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
                  placeholder="Min 6 characters" autoComplete="new-password" disabled={loading}
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-16 text-sm outline-none focus:border-green-400/50 transition-all disabled:opacity-50"/>
                <button type="button" onClick={()=>setShowPass(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs font-bold px-1 transition-colors">
                  {showPass?'Hide':'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <input type={showPass?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)}
                placeholder="Repeat your password" autoComplete="new-password" disabled={loading}
                className={`w-full bg-white/8 border-2 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50 ${confirm && confirm!==password ? 'border-red-400/60' : 'border-white/10 focus:border-green-400/50'}`}/>
              {confirm && confirm !== password && <p className="text-red-400 text-xs mt-1">Passwords do not match</p>}
            </div>

            <button type="submit" disabled={loading || (!!confirm && confirm !== password)}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg mt-1">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating account...</>
                : <><span>✨</span>Create Account</>}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/8 text-center text-sm space-y-2">
            <p className="text-white/35">
              Already have an account?{' '}
              <Link href="/login" className="text-green-400 font-bold hover:text-green-300">Sign In →</Link>
            </p>
            <Link href="/" className="block text-white/20 text-xs hover:text-white/40 transition-colors">← Back to School Website</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
