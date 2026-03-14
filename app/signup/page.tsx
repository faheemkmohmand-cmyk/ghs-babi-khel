'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!email) { setError('Please enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPass) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } }
      })

      if (signupError) { setError(signupError.message); return }

      // Always create profile immediately
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: fullName.trim(),
          role: 'student'
        })
      }

      setSuccess(true)
      // Auto redirect to login after 2 seconds
      setTimeout(() => { window.location.href = '/login' }, 2000)

    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xl">🏫</div>
          <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
          <p className="text-white/40 text-sm mt-1">Create your school account</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-black text-slate-800 mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">Join GHS Babi Khel School Portal</p>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-700 text-sm font-bold">❌ {error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-black text-green-700 text-lg">Account Created!</p>
              <p className="text-slate-500 text-sm mt-2">Redirecting to login page...</p>
              <Link href="/login" className="mt-4 inline-block bg-green-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
                Go to Login →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  disabled={loading}
                  autoComplete="name"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors disabled:opacity-50"/>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-lg">
                {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                {loading ? 'Creating account...' : '🎓 Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-slate-400 text-sm mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-green-700 font-bold hover:underline">Sign In →</Link>
            </p>
          )}
          <Link href="/" className="block text-center text-slate-300 text-xs mt-2 hover:text-slate-500">← Back to website</Link>
        </div>
      </div>
    </div>
  )
}
