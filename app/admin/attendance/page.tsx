'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CLASSES = ['6','7','8','9','10']
const SECTIONS = ['A','B','C']
type Student = { id:string; full_name:string; roll_no:string }
type AttRow = { student_id:string; status:'present'|'absent'|'late'|'leave' }
const statusStyles: Record<string,string> = {
  present:'bg-green-900 text-white border-green-900',
  absent:'bg-red-500 text-white border-red-500',
  late:'bg-amber-500 text-white border-amber-500',
  leave:'bg-sky-500 text-white border-sky-500',
}

export default function AdminAttendancePage() {
  const [selClass, setSelClass] = useState('9')
  const [selSection, setSelSection] = useState('A')
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [rows, setRows] = useState<AttRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [profile, setProfile] = useState<{full_name:string}|null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id',user.id).single()
      if (!p||p.role!=='admin') { window.location.href='/dashboard'; return }
      setProfile(p)
      setLoading(false)
    }
    init()
  }, [])

  async function loadAttendance() {
    setFetching(true)
    setLoaded(false)
    const { data: studs } = await supabase.from('students').select('id,full_name,roll_no').eq('class',selClass).eq('section',selSection).eq('status','active').order('roll_no')
    const { data: existing } = await supabase.from('attendance').select('student_id,status').eq('date',selDate).eq('class',selClass).eq('section',selSection)
    const existingMap = new Map((existing||[]).map(r=>[r.student_id,r.status]))
    setStudents(studs||[])
    setRows((studs||[]).map(s=>({ student_id:s.id, status:(existingMap.get(s.id)||'present') as any })))
    setLoaded(true)
    setFetching(false)
  }

  function setStatus(studentId:string, status:'present'|'absent'|'late'|'leave') {
    setRows(prev=>prev.map(r=>r.student_id===studentId?{...r,status}:r))
  }

  function markAll(status:'present'|'absent') {
    setRows(prev=>prev.map(r=>({...r,status})))
  }

  async function handleSave() {
    if (!loaded||rows.length===0) { toast.error('Load students first'); return }
    setSaving(true)
    try {
      const records = rows.map(r=>({ student_id:r.student_id, date:selDate, status:r.status, class:selClass, section:selSection }))
      const { error } = await supabase.from('attendance').upsert(records,{onConflict:'student_id,date'})
      if (error) { toast.error(error.message); return }
      toast.success(`Attendance saved for ${rows.length} students ✅`)
    } finally { setSaving(false) }
  }

  const counts = { present:rows.filter(r=>r.status==='present').length, absent:rows.filter(r=>r.status==='absent').length, late:rows.filter(r=>r.status==='late').length, leave:rows.filter(r=>r.status==='leave').length }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full spinner mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-slate-800 text-sm">Attendance</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">✅ Daily Attendance</h1>
            <p className="text-slate-500 text-sm mt-0.5">Mark attendance for any class and date</p>
          </div>
          <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
        </div>

        {/* Selector */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Class</label>
              <div className="flex gap-1.5">
                {CLASSES.map(c=>(
                  <button key={c} onClick={()=>{setSelClass(c);setLoaded(false)}} className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${selClass===c?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Section</label>
              <div className="flex gap-1.5">
                {SECTIONS.map(s=>(
                  <button key={s} onClick={()=>{setSelSection(s);setLoaded(false)}} className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${selSection===s?'bg-green-900 text-white border-green-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
              <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setLoaded(false)}} className="border-2 border-slate-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-green-500 transition-colors"/>
            </div>
            <button onClick={loadAttendance} disabled={fetching} className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all">
              {fetching?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>:null}
              {fetching?'Loading...':'Load Students'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {loaded&&rows.length>0&&(
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[{l:'Present',n:counts.present,cls:'bg-green-50 border-green-200 text-green-700'},{l:'Absent',n:counts.absent,cls:'bg-red-50 border-red-200 text-red-600'},{l:'Late',n:counts.late,cls:'bg-amber-50 border-amber-200 text-amber-700'},{l:'Leave',n:counts.leave,cls:'bg-sky-50 border-sky-200 text-sky-700'}].map(s=>(
              <div key={s.l} className={`${s.cls} border-2 rounded-2xl p-4 text-center`}>
                <div className="font-display text-2xl font-black">{s.n}</div>
                <div className="text-xs font-bold mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Mark all */}
        {loaded&&rows.length>0&&(
          <div className="flex gap-2 mb-4">
            <button onClick={()=>markAll('present')} className="bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm px-4 py-2 rounded-xl border-2 border-green-200 transition-colors">✅ Mark All Present</button>
            <button onClick={()=>markAll('absent')} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm px-4 py-2 rounded-xl border-2 border-red-200 transition-colors">❌ Mark All Absent</button>
          </div>
        )}

        {/* Student list */}
        {loaded&&(
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mb-5">
            {rows.length===0 ? (
              <div className="p-12 text-center"><div className="text-4xl mb-2">🎓</div><p className="text-slate-400 font-semibold">No active students found in Class {selClass}{selSection}</p></div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest w-12">Roll</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row,i)=>{
                    const student = students.find(s=>s.id===row.student_id)
                    return (
                      <tr key={row.student_id} className={`border-t border-slate-50 ${i%2===0?'':'bg-slate-50/40'}`}>
                        <td className="px-4 py-3 text-sm font-black text-slate-500">{student?.roll_no||i+1}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-sm">{student?.full_name||'—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {(['present','absent','late','leave'] as const).map(st=>(
                              <button key={st} onClick={()=>setStatus(row.student_id,st)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all capitalize ${row.status===st?statusStyles[st]:'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}>
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {loaded&&rows.length>0&&(
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-base">
            {saving&&<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner"/>}
            💾 Save Attendance for {rows.length} Students
          </button>
        )}
      </div>
    </div>
  )
}
