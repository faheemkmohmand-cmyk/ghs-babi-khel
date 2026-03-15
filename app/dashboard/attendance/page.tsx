'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


export default function MyAttendancePage() {
  const [student, setStudent] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const user = session.user
      const { data: profile } = await (supabase as any).from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      setProfile(profile)
      const { data: student } = await (supabase as any).from('students').select('*').eq('user_id', user.id).maybeSingle()
      setStudent(student)
      if (student) {
        const { data: records } = await (supabase as any).from('attendance').select('*').eq('student_id', student.id).order('date', {ascending:false}).limit(60)
        setRecords(records || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const total   = records.length
  const present = records.filter(r => r.status === 'present' || r.status === 'late').length
  const absent  = records.filter(r => r.status === 'absent').length
  const pct     = total > 0 ? Math.round((present/total)*100) : 0

  const statusStyle: Record<string,string> = {
    present: 'bg-green-50 text-green-700 border-green-200',
    absent:  'bg-red-50 text-red-600 border-red-200',
    late:    'bg-amber-50 text-amber-700 border-amber-200',
    leave:   'bg-sky-50 text-sky-700 border-sky-200',
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 font-semibold">Loading attendance...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-bold text-slate-800 text-sm">My Attendance</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>✅ My Attendance</h1>
            {student && <p className="text-slate-500 text-sm mt-0.5">Class {student.class}{student.section} · Roll {student.roll_no}</p>}
          </div>
          <Link href="/dashboard" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Dashboard</Link>
        </div>

        {!student ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <p className="text-slate-500">Contact your admin to link your student profile.</p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-6 text-white mb-6" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-white/50 text-sm">Attendance Rate</p>
                  <div className="text-5xl font-black">{pct}%</div>
                  <p className={`text-sm font-bold mt-1 ${pct >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                    {pct >= 75 ? '✅ Good standing' : '⚠️ Below 75% — needs improvement'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:'Present',n:present,c:'text-green-400'},{l:'Absent',n:absent,c:'text-red-400'},{l:'Total',n:total,c:'text-white'},{l:'Leave',n:records.filter(r=>r.status==='leave').length,c:'text-sky-400'}].map(s=>(
                    <div key={s.l} className="bg-white/10 rounded-xl px-4 py-2.5 text-center">
                      <div className={`text-xl font-black ${s.c}`}>{s.n}</div>
                      <div className="text-white/50 text-xs">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${pct >= 75 ? 'bg-green-400' : 'bg-amber-400'}`} style={{width:`${pct}%`}}/>
              </div>
            </div>

            {records.length === 0 ? (
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
                      {records.map((r:any, i:number) => (
                        <tr key={r.id} className={`border-t border-slate-50 ${i%2===0?'':'bg-slate-50/40'}`}>
                          <td className="px-4 py-3 font-bold text-slate-800 text-sm">{r.date}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{new Date(r.date+'T00:00:00').toLocaleDateString('en-US',{weekday:'long'})}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusStyle[r.status]||'bg-slate-100 text-slate-500 border-slate-200'}`}>{r.status}</span>
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
