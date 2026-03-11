import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ResultsPage() {
  const supabase = createClient()
  const { data: exams } = await supabase.from('exams').select('name,type,status').eq('status','completed').order('end_date', { ascending:false })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Results</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📊 Exam Results</h1>
        <p className="text-slate-500 mb-8">Login to your student portal to see your personal results</p>

        <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-3xl p-8 text-white text-center mb-8">
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="font-display text-2xl font-black mb-2">Student Portal</h2>
          <p className="text-white/60 mb-6">View your personal results, attendance, and more</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="bg-white text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-all">Login</Link>
            <Link href="/signup" className="bg-green-900 hover:bg-green-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm border border-green-700 transition-all">Sign Up</Link>
          </div>
        </div>

        {exams && exams.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="font-display text-lg font-black text-slate-800 mb-4">📝 Completed Exams</h2>
            <div className="space-y-2">
              {exams.map((ex, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-800 text-sm">{ex.name}</span>
                  <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">Results Available</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
