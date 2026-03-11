import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()
  const { data: attendance } = await supabase.from('attendance').select('*')
    .eq('student_id', student?.id || '').order('date', { ascending: false }).limit(60)

  const total = attendance?.length || 0
  const present = attendance?.filter(a => a.status === 'present').length || 0
  const absent = attendance?.filter(a => a.status === 'absent').length || 0
  const late = attendance?.filter(a => a.status === 'late').length || 0
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  const statusColor: Record<string,string> = { present:'bg-green-100 text-green-700', absent:'bg-red-100 text-red-700', late:'bg-amber-100 text-amber-700', leave:'bg-sky-100 text-sky-700' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 text-sm font-semibold">← Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800 text-sm">My Attendance</span>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-black text-slate-800 mb-6">✅ My Attendance</h1>

        {!student ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-700 font-bold">Your student profile hasn't been linked yet. Contact admin.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label:'Attendance %', value:`${pct}%`, bg:'bg-green-50', text:'text-green-700', border:'border-green-100' },
                { label:'Present Days', value:present, bg:'bg-sky-50', text:'text-sky-700', border:'border-sky-100' },
                { label:'Absent Days', value:absent, bg:'bg-red-50', text:'text-red-700', border:'border-red-100' },
                { label:'Late/Leave', value:late, bg:'bg-amber-50', text:'text-amber-700', border:'border-amber-100' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} ${s.border} border-2 rounded-2xl p-4`}>
                  <div className={`font-display text-3xl font-black ${s.text}`}>{s.value}</div>
                  <div className="text-slate-500 text-xs font-semibold mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="mb-4 bg-slate-200 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all ${pct>=75?'bg-green-500':pct>=50?'bg-amber-500':'bg-red-500'}`} style={{width:`${pct}%`}} />
            </div>
            {pct < 75 && <p className="text-red-600 text-sm font-bold mb-6">⚠️ Attendance below 75%. Improvement needed.</p>}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {attendance?.length === 0 ? (
                <div className="text-center py-16"><div className="text-5xl mb-3">📅</div><p className="text-slate-400 font-semibold">No attendance records yet</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {attendance?.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                      <span className="text-sm font-semibold text-slate-700">{a.date}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${statusColor[a.status]||'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
