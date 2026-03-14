'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [form, setForm] = useState({ fullName:'', email:'', phone:'', password:'', confirm:'', role:'student' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(k: string, v: string) { setForm(f => ({...f,[k]:v})) }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName||!form.email||!form.password) { toast.error('Please fill all required fields'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, role: form.role, phone: form.phone }
        }
      })
      if (error) { toast.error(error.message); return }
      if (data.user) {
        toast.success('Account created! Welcome to GHS Babi Khel 🎉')
        router.push('/dashboard')
      }
    } catch { toast.error('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="absolute inset-0 pointer-events-none"
        style={{backgroundImage:'linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />

      <div className="w-full max-w-md animate-fade-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xl ring-4 ring-green-400/15">🏫</div>
          <h1 className="font-display text-xl font-black text-white">GHS Babi Khel</h1>
          <p className="text-white/35 text-xs mt-1">Student & Parent Registration</p>
        </div>

        <div className="bg-white/6 backdrop-blur-xl border border-white/10 rounded-3xl p-7">
          <h2 className="font-display text-xl font-black text-white mb-1">Create Account</h2>
          <p className="text-white/35 text-sm mb-6">Join the GHS Babi Khel portal</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-white/5 rounded-xl">
            {[{v:'student',label:'🎓 Student'},{v:'parent',label:'👨‍👩‍👧 Parent'}].map(r=>(
              <button key={r.v} type="button" onClick={()=>update('role',r.v)}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all ${form.role===r.v
                  ? 'bg-green-900 text-white shadow-md'
                  : 'text-white/40 hover:text-white/70'}`}>
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Full Name *</label>
              <input type="text" value={form.fullName} onChange={e=>update('fullName',e.target.value)}
                placeholder="Your full name" autoComplete="name"
                className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400/50 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Email Address *</label>
              <input type="email" value={form.email} onChange={e=>update('email',e.target.value)}
                placeholder="your@email.com" autoComplete="email"
                className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400/50 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e=>update('phone',e.target.value)}
                placeholder="0300-1234567"
                className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400/50 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.password} onChange={e=>update('password',e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">Confirm *</label>
                <input type={showPass?'text':'password'} value={form.confirm} onChange={e=>update('confirm',e.target.value)}
                  placeholder="Repeat"
                  className="w-full bg-white/8 border-2 border-white/10 text-white placeholder-white/20 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400/50 transition-all" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" onChange={e=>setShowPass(e.target.checked)}
                className="w-4 h-4 accent-green-500 rounded" />
              <span className="text-white/35 text-xs">Show passwords</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>Creating account...</>
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
