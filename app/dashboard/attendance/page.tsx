import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MyAttendancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id',user.id).single()
  const { data: student } = await supabase.from('students').select('*').eq('user_id',user.id).maybeSingle()
  const { data: records } = student
    ? await supabase.from('attendance').select('*').eq('student_id',student.id).order('date',{ascending:false})
    : { data: [] }

  const total = records?.length||0
  const present = records?.filter(r=>r.status==='present').length||0
  const absent = records?.filter(r=>r.status==='absent').length||0
  const late = records?.filter(r=>r.status==='late').length||0
  const leave = records?.filter(r=>r.status==='leave').length||0
  const pct = total>0?Math.round((present/total)*100):0
  const statusBadge: Record<string,string> = { present:'bg-green-50 text-green-700 border-green-200', absent:'bg-red-50 text-red-600 border-red-200', late:'bg-amber-50 text-amber-700 border-amber-200', leave:'bg-sky-50 text-sky-700 border-sky-200' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-navy-800 text-sm">My Attendance</span>
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
            <h1 className="font-display text-2xl font-black text-navy-800">✅ My Attendance</h1>
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
        ) : (
          <>
            {/* Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-3xl p-6 text-white mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white/50 text-sm font-semibold">Attendance Percentage</p>
                  <div className="font-display text-5xl font-black mt-1">{pct}%</div>
                  {pct<75&&<p className="text-red-300 text-sm mt-1 font-bold">⚠️ Below 75% — improvement needed</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:'Present',n:present,c:'text-green-400'},{l:'Absent',n:absent,c:'text-red-400'},{l:'Late',n:late,c:'text-amber-400'},{l:'Leave',n:leave,c:'text-sky-400'}].map(s=>(
                    <div key={s.l} className="bg-white/10 rounded-xl px-4 py-2.5 text-center">
                      <div className={`font-display text-xl font-black ${s.c}`}>{s.n}</div>
                      <div className="text-white/50 text-xs">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 bg-white/10 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${pct>=75?'bg-green-400':'bg-amber-400'}`} style={{width:`${pct}%`}}/>
              </div>
            </div>

            {/* Records */}
            {!records?.length ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-slate-500 font-semibold">No attendance records yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Day</th>
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r,i)=>(
                        <tr key={r.id} className={`border-t border-slate-50 ${i%2===0?'':'bg-slate-50/40'}`}>
                          <td className="px-4 py-3 font-bold text-navy-800 text-sm">{r.date}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{new Date(r.date).toLocaleDateString('en-US',{weekday:'long'})}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusBadge[r.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
