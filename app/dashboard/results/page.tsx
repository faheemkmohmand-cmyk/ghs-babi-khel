import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MyResultsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id',user.id).single()
  const { data: student } = await supabase.from('students').select('*').eq('user_id',user.id).maybeSingle()
  const { data: results } = student
    ? await supabase.from('results').select('*').eq('student_id',student.id).order('created_at',{ascending:false})
    : { data: [] }

  function gradeColor(g:string) {
    if(g==='A+'||g==='A') return 'bg-green-900 text-white'
    if(g==='B') return 'bg-blue-600 text-white'
    if(g==='C') return 'bg-amber-500 text-white'
    if(g==='D') return 'bg-orange-500 text-white'
    return 'bg-red-500 text-white'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-navy-800 text-sm">My Results</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-navy-800">📊 My Results</h1>
            {student&&<p className="text-slate-500 text-sm mt-0.5">Class {student.class}{student.section} · Roll {student.roll_no}</p>}
          </div>
          <Link href="/dashboard" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Dashboard</Link>
        </div>

        {!student ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="font-display font-black text-navy-800 text-xl mb-2">Profile Not Linked</h3>
            <p className="text-slate-500">Your student profile is being set up by admin. Check back soon.</p>
          </div>
        ) : !results?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="font-display font-black text-navy-800 text-xl mb-2">No Results Yet</h3>
            <p className="text-slate-500">Your results will appear here once admin uploads them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map(r=>(
              <div key={r.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-green-950 text-white p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">{r.year}</p>
                      <h3 className="font-display text-xl font-black">{r.exam_name}</h3>
                      <p className="text-white/50 text-sm">{r.student_name} · Class {r.class}{r.section} · Roll {r.roll_no}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-black w-14 h-14 rounded-2xl flex items-center justify-center ${gradeColor(r.grade)}`}>{r.grade}</div>
                      <div className="text-right">
                        <div className="font-display text-2xl font-black">{r.percentage}%</div>
                        <div className={`text-sm font-black ${r.result==='Pass'?'text-green-400':'text-red-400'}`}>{r.result}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 text-sm">
                    Total: <span className="font-black">{r.obtained_marks}/{r.total_marks}</span> marks
                  </div>
                </div>

                {/* Subjects */}
                {r.subjects?.length>0&&(
                  <div className="p-5">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Subject-wise Marks</p>
                    <div className="space-y-2">
                      {(r.subjects as Array<{subject:string;total:number;obtained:number}>).map((s,i)=>{
                        const pct = s.total>0?Math.round((s.obtained/s.total)*100):0
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-32 text-sm font-bold text-slate-700 flex-shrink-0">{s.subject}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${pct>=50?'bg-green-900':'bg-red-400'}`} style={{width:`${pct}%`}}/>
                            </div>
                            <div className="text-sm font-black text-slate-600 w-20 text-right flex-shrink-0">{s.obtained}/{s.total} <span className="text-slate-400 font-normal">({pct}%)</span></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
