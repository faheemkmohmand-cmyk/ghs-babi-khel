'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !password) { toast.error('Please fill all fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirmPass) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) { toast.error(error.message); return }

      // Insert profile
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          role: 'student',
        })
      }

      toast.success('Account created! Please check your email to verify, then login.')
      router.push('/login')
    } catch { toast.error('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{backgroundImage:'linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl ring-8 ring-green-400/10">🏫</div>
          <h1 className="font-display text-3xl font-black text-white mb-3">Join GHS Babi Khel<br/>Student Portal</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">Create your account to access results, attendance, timetable and more.</p>
          <div className="space-y-3 text-left">
            {[
              { icon: '📊', text: 'Check your exam results anytime' },
              { icon: '✅', text: 'View your attendance record' },
              { icon: '📅', text: 'See your class timetable' },
              { icon: '📢', text: 'Get important school notices' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 text-white/60 text-sm">
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">🏫</div>
            <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
          </div>

          <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="font-display text-2xl font-black text-white mb-1">Create Account</h2>
            <p className="text-white/40 text-sm mb-7">Join the student portal</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name" autoComplete="name"
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 focus:bg-white/10 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" autoComplete="email"
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 focus:bg-white/10 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters" autoComplete="new-password"
                    className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-green-400/50 focus:bg-white/10 transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm">
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat password" autoComplete="new-password"
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400/50 focus:bg-white/10 transition-all" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg mt-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Creating account...</>
                  : <><span>🎓</span>Create Account</>}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/8 space-y-3 text-center text-sm">
              <p className="text-white/35">
                Already have an account?{' '}
                <Link href="/login" className="text-green-400 font-bold hover:text-green-300 transition-colors">Sign In →</Link>
              </p>
              <Link href="/" className="block text-white/20 text-xs hover:text-white/40 transition-colors">← Back to School Website</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
