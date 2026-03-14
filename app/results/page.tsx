import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const MIDDLE = ['6','7','8']

function getRankBadge(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default async function ResultsPage() {
  const supabase = createClient()
  const { data: classResults } = await supabase
    .from('class_results').select('*').eq('published', true)
    .order('class').order('created_at', { ascending: false })

  const classes = ['6','7','8','9','10']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 text-white px-4 py-3 flex items-center gap-3 shadow-lg" style={{ background: '#0a1628' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#014d26,#4ade80)' }}>🏫</div>
          <span className="font-bold text-sm hidden sm:block">GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white font-bold text-sm">Results</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black text-slate-800 mb-2">📊 Exam Results</h1>
          <p className="text-slate-500">Official results for all classes at GHS Babi Khel</p>
        </div>

        {!classResults?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-500 font-bold text-lg">No results published yet</p>
            <p className="text-slate-400 text-sm mt-1">Check back after exams</p>
          </div>
        ) : (
          <div className="space-y-12">
            {classes.map(cls => {
              const clsResults = (classResults || []).filter(r => r.class === cls)
              if (!clsResults.length) return null
              const isMiddle = MIDDLE.includes(cls)
              return (
                <div key={cls}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`px-4 py-2 rounded-xl text-white font-black text-sm ${isMiddle ? 'bg-blue-600' : 'bg-green-800'}`}>
                      Class {cls} {isMiddle ? '— Middle' : '— High (BISE)'}
                    </div>
                    <div className="flex-1 h-px bg-slate-200"/>
                  </div>
                  <div className="space-y-6">
                    {clsResults.map(cr => (
                      <ClassResultCard key={cr.id} cr={cr} supabase={supabase}/>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

async function ClassResultCard({ cr, supabase }: { cr: any; supabase: any }) {
  const { data: students } = await supabase
    .from('student_results').select('*').eq('class_result_id', cr.id).order('rank')

  const passCount = students?.filter((s: any) => s.status === 'pass').length || 0
  const pct = cr.total_students > 0 ? Math.round((passCount / cr.total_students) * 100) : 0
  const isMiddle = MIDDLE.includes(cr.class)

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 text-white" style={{ background: isMiddle ? 'linear-gradient(135deg,#1e3a8a,#3b82f6)' : 'linear-gradient(135deg,#0a1628,#014d26)' }}>
        <h2 className="font-display text-2xl font-black mb-1">{cr.exam_name}</h2>
        <div className="flex flex-wrap gap-4 text-white/70 text-sm">
          <span>📅 {cr.year}</span>
          <span>👥 {cr.total_students} Students</span>
          <span>✅ {passCount} Passed</span>
          <span>📈 {pct}% Pass Rate</span>
        </div>
        {/* Pass rate bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }}/>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Total Students', val: cr.total_students },
          { label: 'Pass', val: passCount },
          { label: 'Pass %', val: `${pct}%` },
        ].map(s => (
          <div key={s.label} className="px-5 py-4 text-center">
            <div className="font-display text-2xl font-black text-slate-800">{s.val}</div>
            <div className="text-slate-400 text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Student table */}
      {students && students.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Rank','Student Name','Roll No','Obtained','Total','Percentage','Status','Remarks'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s: any) => (
                <tr key={s.id} className={`hover:bg-slate-50 ${s.status === 'fail' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-black text-slate-600">{getRankBadge(s.rank)}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{s.student_name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.roll_no}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{s.obtained_marks}</td>
                  <td className="px-4 py-3 text-slate-500">{s.total_marks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.percentage >= 50 ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${Math.min(s.percentage, 100)}%` }}/>
                      </div>
                      <span className={`text-xs font-black ${s.percentage >= 50 ? 'text-green-700' : 'text-red-600'}`}>{s.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${s.status === 'pass' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {s.status === 'pass' ? '✅ Pass' : '❌ Fail'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
