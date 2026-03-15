import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ResultsPage() {
  let results: any[] = []
  let settings: any = null
  try {
    const supabase = createClient()
  const { data: settings } = await (supabase as any).from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
    const { data } = await (supabase as any)
      .from('results').select('*')
      .order('class').order('percentage', { ascending: false })
    results = data || []
  } catch (_) {}

  const exams    = (results.map(r => r.exam_name).filter((v:any,i:number,a:any[])=>a.indexOf(v)===i)
  const classes  = ['6','7','8','9','10']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Results</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>📊 Exam Results</h1>
        <p className="text-slate-500 mb-8">Official examination results — GHS Babi Khel</p>

        {results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-400 font-semibold text-lg">Results will appear here once published by admin</p>
          </div>
        ) : (
          <div className="space-y-10">
            {exams.map(exam => {
              const examResults = results.filter(r => r.exam_name === exam)
              const year = examResults[0]?.year || ''

              // Overall exam summary
              const totalStudents = examResults.length
              const passed  = examResults.filter(r => r.result === 'Pass').length
              const failed  = totalStudents - passed
              const avgPct  = totalStudents > 0
                ? Math.round(examResults.reduce((a,r) => a + r.percentage, 0) / totalStudents)
                : 0

              return (
                <div key={exam} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  {/* Exam header */}
                  <div className="px-6 py-5" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
                    <h2 className="font-black text-white text-xl" style={{fontFamily:'Georgia,serif'}}>{exam}</h2>
                    <p className="text-white/50 text-sm mt-0.5">{year} · GHS Babi Khel</p>

                    {/* Overall summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {[
                        {label:'Total Students', val:totalStudents, color:'text-white'},
                        {label:'Passed',          val:passed,        color:'text-green-400'},
                        {label:'Failed',          val:failed,        color:'text-red-400'},
                        {label:'Average %',       val:avgPct+'%',    color:'text-amber-400'},
                      ].map(s => (
                        <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
                          <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                          <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per class results */}
                  {classes.map(cls => {
                    const classResults = examResults
                      .filter(r => r.class === cls)
                      .sort((a, b) => b.percentage - a.percentage)
                    if (classResults.length === 0) return null

                    const clsPassed = classResults.filter(r => r.result === 'Pass').length
                    const clsFailed = classResults.length - clsPassed
                    const clsAvg    = Math.round(classResults.reduce((a,r) => a + r.percentage, 0) / classResults.length)

                    return (
                      <div key={cls} className="border-t border-slate-100">
                        {/* Class header */}
                        <div className="px-6 py-3 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-slate-800 text-white text-xs font-black px-3 py-1.5 rounded-xl">Class {cls}</span>
                            <span className="text-slate-500 text-sm">{classResults.length} students</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="text-green-600">✅ Passed: {clsPassed}</span>
                            <span className="text-red-500">❌ Failed: {clsFailed}</span>
                            <span className="text-slate-500">Avg: {clsAvg}%</span>
                          </div>
                        </div>

                        {/* Results table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                {['Rank','Student','Roll No','Marks','%','Grade','Result'].map(h=>(
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {classResults.map((r, i) => (
                                <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                                  <td className="px-4 py-3">
                                    <span className="text-lg font-black">
                                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-slate-400 text-sm">#{i+1}</span>}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-800 text-sm">{r.student_name}</div>
                                    {i < 3 && (
                                      <div className={`text-xs font-bold mt-0.5 ${i===0?'text-amber-600':i===1?'text-slate-500':'text-amber-700'}`}>
                                        {i===0?'1st Position':i===1?'2nd Position':'3rd Position'}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">{r.roll_no || '—'}</td>
                                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.obtained_marks}/{r.total_marks}</td>
                                  <td className="px-4 py-3">
                                    <span className={`font-black text-sm ${r.percentage>=70?'text-green-700':r.percentage>=50?'text-amber-600':'text-red-600'}`}>
                                      {r.percentage}%
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                      r.grade==='A+'?'bg-green-900 text-white':
                                      r.grade==='A'?'bg-green-100 text-green-800':
                                      r.grade==='B'?'bg-blue-100 text-blue-800':
                                      r.grade==='C'?'bg-amber-100 text-amber-800':
                                      r.grade==='D'?'bg-orange-100 text-orange-700':
                                      'bg-red-100 text-red-700'
                                    }`}>{r.grade}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${r.result==='Pass'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-600 border-red-200'}`}>
                                      {r.result}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
