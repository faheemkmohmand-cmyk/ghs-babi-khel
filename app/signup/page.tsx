'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!fullName || !email || !password) { setError('Please fill all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPass) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })

      if (signupError) {
        setError('Signup failed: ' + signupError.message)
        return
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          role: 'student',
        })
        if (profileError) {
          setError('Profile error: ' + profileError.message)
          return
        }
      }

      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => router.push('/login'), 1500)
    } catch (e: any) {
      setError('Exception: ' + e.message)
    } finally {
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
          <h2 className="font-display text-2xl font-black text-slate-800 mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">Join the student portal</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-700 text-sm font-semibold">❌ {error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <p className="text-green-700 text-sm font-semibold">✅ {success}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Confirm Password</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repeat password"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 transition-colors"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all">
              {loading ? 'Creating account...' : '🎓 Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-green-700 font-bold hover:underline">Sign In →</Link>
          </p>
          <Link href="/" className="block text-center text-slate-300 text-xs mt-2 hover:text-slate-500">← Back to website</Link>
        </div>
      </div>
    </div>
  )
}
