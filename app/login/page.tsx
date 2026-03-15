import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 0

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient()
  const { data } = await supabase.from('school_settings').select('logo_url,school_name').order('updated_at', { ascending: false }).limit(1)
  const logoUrl = data?.[0]?.logo_url || ''
  const schoolName = data?.[0]?.school_name || 'GHS Babi Khel'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#020810,#0a1628,#014d26)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-green-800 to-green-400 flex items-center justify-center mx-auto mb-3 shadow-2xl">
            {logoUrl
              ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover"/>
              : <span className="text-white font-black text-xl">GHS</span>
            }
          </div>
          <h1 className="text-white font-black text-xl">{schoolName}</h1>
          <p className="text-white/40 text-sm">School Portal</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-black text-slate-800 text-2xl mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">Welcome back</p>
          {searchParams?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm font-semibold">{decodeURIComponent(searchParams.error)}</p>
            </div>
          )}
          <form action="/auth/login" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" name="email" required placeholder="you@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input type="password" name="password" required placeholder="Your password"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"/>
            </div>
            <button type="submit" className="w-full bg-green-900 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl text-base transition-all">
              Sign In
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-5">
            No account? <Link href="/signup" className="text-green-700 font-bold hover:underline">Create one</Link>
          </p>
          <Link href="/" className="block text-center text-slate-300 text-xs mt-2 hover:text-slate-500">Back to website</Link>
        </div>
      </div>
    </div>
  )
}
