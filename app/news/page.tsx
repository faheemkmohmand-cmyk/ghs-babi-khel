import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export default async function Page() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2 capitalize">/ news</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🏗️</div>
        <h1 className="font-display text-3xl font-black text-slate-800 mb-3 capitalize">news</h1>
        <p className="text-slate-500 mb-6">This page is coming in Phase 3. Data is being managed from the admin panel.</p>
        <Link href="/" className="bg-green-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-950 transition-all">← Back to Home</Link>
      </div>
    </div>
  )
}
