import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ResultsPage() {
  const supabase = createClient()
  const { data: results } = await supabase.from('results').select('*').order('class').order('percentage',{ascending:false})
  const classes = Array.from(new Set((results?.map(r=>r.class)||[]) as string[]))

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy-900/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-white text-sm">GHS Babi Khel</span>
          </Link>
          <Link href="/" className="text-white/40 hover:text-white text-sm font-semibold transition-colors">← Home</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-navy-800 mb-2">📊 Exam Results</h1>
          <p className="text-slate-500">Results published by GHS Babi Khel administration</p>
        </div>

        {!results?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-500 font-semibold">No results published yet</p>
            <p className="text-slate-400 text-sm mt-1">Check back after your exams</p>
          </div>
        ) : classes.map(cls=>{
          const classResults = results.filter(r=>r.class===cls)
          return (
            <div key={cls} className="mb-8">
              <h2 className="font-display font-black text-navy-800 text-xl mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-900 rounded-full inline-block"/>
                Class {cls}
              </h2>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest w-12">#</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Exam</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">Marks</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">%</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">Grade</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classResults.map((r,i)=>(
                        <tr key={r.id} className={`border-t border-slate-50 ${i%2===0?'':'bg-slate-50/40'}`}>
                          <td className="px-4 py-3 text-sm font-black text-slate-400">{i+1}</td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-navy-800 text-sm">{r.student_name}</p>
                            <p className="text-xs text-slate-400">Roll {r.roll_no} · {r.class}{r.section}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{r.exam_name}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">{r.obtained_marks}/{r.total_marks}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-black ${r.percentage>=50?'text-green-700':'text-red-600'}`}>{r.percentage}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block font-black text-sm px-2.5 py-1 rounded-lg ${r.grade==='A+'?'bg-green-900 text-white':r.grade==='A'?'bg-green-100 text-green-800':r.grade==='B'?'bg-blue-100 text-blue-800':r.grade==='C'?'bg-amber-100 text-amber-800':'bg-red-100 text-red-700'}`}>{r.grade}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${r.result==='Pass'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-600 border-red-200'}`}>{r.result}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
