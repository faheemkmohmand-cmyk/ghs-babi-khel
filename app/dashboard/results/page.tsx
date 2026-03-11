import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()
  const { data: results } = await supabase.from('results').select('*')
    .eq('student_id', student?.id || '').order('created_at', { ascending: false })

  const gradeColor: Record<string,string> = { 'A+':'bg-green-100 text-green-800','A':'bg-green-50 text-green-700','B':'bg-sky-50 text-sky-700','C':'bg-amber-50 text-amber-700','D':'bg-orange-50 text-orange-700','F':'bg-red-50 text-red-700' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 text-sm font-semibold">← Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800 text-sm">My Results</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-black text-slate-800 mb-6">📊 My Results</h1>
        {!student ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-700 font-bold">Your student profile hasn't been linked yet. Contact admin.</p>
          </div>
        ) : results?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-400 font-semibold">No results published yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results?.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg font-black text-slate-800">{r.exam_name}</h3>
                    <p className="text-slate-500 text-sm">{r.year} · Class {r.class}{r.section} · Roll {r.roll_no}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-black text-slate-800">{r.percentage}%</div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${gradeColor[r.grade]||'bg-slate-100 text-slate-600'}`}>{r.grade}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.result==='Pass'?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-600 border border-red-200'}`}>{r.result}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                  <span className="text-sm text-slate-500">Total: <strong className="text-slate-800">{r.total_marks}</strong></span>
                  <span className="text-sm text-slate-500">Obtained: <strong className="text-slate-800">{r.obtained_marks}</strong></span>
                  {r.position && <span className="text-sm text-slate-500">Position: <strong className="text-slate-800">#{r.position}</strong></span>}
                </div>
                <div className="mt-3 bg-slate-50 rounded-xl overflow-hidden h-2">
                  <div className={`h-2 rounded-xl transition-all ${r.percentage>=60?'bg-green-500':r.percentage>=40?'bg-amber-500':'bg-red-500'}`}
                    style={{width:`${Math.min(r.percentage,100)}%`}} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
