import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{background:'linear-gradient(135deg,#020810 0%,#0a1628 50%,#014d26 100%)'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-2xl mx-auto mb-3">GHS</div>
          <div className="font-display text-xl font-black text-white">GHS Babi Khel</div>
          <p className="text-white/40 text-sm mt-1">School Portal</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display text-2xl font-black text-slate-800 mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">Welcome back to GHS Babi Khel</p>
          {searchParams?.error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-700 text-sm font-bold">{decodeURIComponent(searchParams.error)}</p>
            </div>
          )}
          <form action="/auth/login" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input type="email" name="email" required placeholder="you@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input type="password" name="password" required placeholder="Your password"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400"/>
            </div>
            <button type="submit"
              className="w-full bg-green-900 hover:bg-green-950 text-white font-bold py-3.5 rounded-xl text-base shadow-lg">
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
