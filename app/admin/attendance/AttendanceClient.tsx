'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


type Student = { id:string; full_name:string; class:string; section:string; roll_no:string; photo_url?:string }
type AttendanceRecord = { id:string; student_id:string; date:string; status:string; class:string; section:string }
type StatusType = 'present'|'absent'|'late'|'leave'

const STATUS_COLORS: Record<StatusType,string> = {
  present: 'bg-green-100 text-green-800 border-green-300',
  absent:  'bg-red-100 text-red-800 border-red-300',
  late:    'bg-amber-100 text-amber-800 border-amber-300',
  leave:   'bg-sky-100 text-sky-800 border-sky-300',
}
const STATUS_ICONS: Record<StatusType,string> = { present:'✅', absent:'❌', late:'⏰', leave:'🏖️' }

export default function AttendanceClient({ students, initialAttendance, today }: { students:Student[]; initialAttendance:AttendanceRecord[]; today:string }) {
  const supabase = createClient()

  const [date, setDate] = useState(today)
  const [selClass, setSelClass] = useState('')
  const [selSection, setSelSection] = useState('A')
  const [attendance, setAttendance] = useState<Record<string,StatusType>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const classes = students.map(s=>s.class as string).filter((v,i,a)=>a.indexOf(v)===i).sort()
  const classStudents = students.filter(s => (!selClass || s.class === selClass) && s.section === selSection)
  const presentCount = Object.values(attendance).filter(v=>v==='present').length
  const absentCount = Object.values(attendance).filter(v=>v==='absent').length

  useEffect(() => {
    if (date === today) {
      const map: Record<string,StatusType> = {}
      initialAttendance.forEach(r => { map[r.student_id] = r.status as StatusType })
      setAttendance(map)
    }
  }, [])

  async function loadAttendance() {
    if (!selClass) { toast.error('Select a class first'); return }
    setLoading(true)
    const { data } = await supabase.from('attendance').select('*').eq('date', date).eq('class', selClass).eq('section', selSection)
    const map: Record<string,StatusType> = {}
    data?.forEach(r => { map[r.student_id] = r.status as StatusType })
    // Default all to present if no data
    classStudents.forEach(s => { if (!map[s.id]) map[s.id] = 'present' })
    setAttendance(map)
    setLoading(false)
    toast.success(`Loaded attendance for Class ${selClass}${selSection}`)
  }

  function setStatus(studentId: string, status: StatusType) {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: StatusType) {
    const map: Record<string,StatusType> = {}
    classStudents.forEach(s => { map[s.id] = status })
    setAttendance(prev => ({ ...prev, ...map }))
  }

  async function handleSave() {
    if (!selClass) { toast.error('Select a class first'); return }
    if (classStudents.length === 0) { toast.error('No students in this class'); return }
    setSaving(true)
    try {
      const records = classStudents.map(s => ({
        student_id: s.id, date, status: attendance[s.id] || 'present',
        class: s.class, section: s.section,
      }))
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
      if (error) { toast.error(error.message); return }
      toast.success(`✅ Attendance saved for ${classStudents.length} students!`)
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>✅ Mark Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Select class, date and mark present/absent for each student</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} max={today}
              className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class</label>
            <select value={selClass} onChange={e=>setSelClass(e.target.value)} className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
              <option value="">Select Class</option>
              {classes.map(c=><option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Section</label>
            <select value={selSection} onChange={e=>setSelSection(e.target.value)} className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
              <option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>
            </select>
          </div>
          <button onClick={loadAttendance} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '🔄'} Load
          </button>
        </div>
      </div>

      {classStudents.length > 0 && (
        <>
          {/* Summary + Bulk actions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div className="text-center"><div className="text-xl font-black text-green-700">{presentCount}</div><div className="text-xs text-slate-400 font-bold">Present</div></div>
              <div className="text-center"><div className="text-xl font-black text-red-600">{absentCount}</div><div className="text-xs text-slate-400 font-bold">Absent</div></div>
              <div className="text-center"><div className="text-xl font-black text-amber-600">{Object.values(attendance).filter(v=>v==='late').length}</div><div className="text-xs text-slate-400 font-bold">Late</div></div>
              <div className="text-center"><div className="text-xl font-black text-sky-600">{Object.values(attendance).filter(v=>v==='leave').length}</div><div className="text-xs text-slate-400 font-bold">Leave</div></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 self-center">Mark all:</span>
              {(['present','absent','late','leave'] as StatusType[]).map(s=>(
                <button key={s} onClick={()=>markAll(s)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${STATUS_COLORS[s]}`}>{STATUS_ICONS[s]} {s}</button>
              ))}
            </div>
          </div>

          {/* Student list */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
            {classStudents.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-slate-50' : ''} hover:bg-slate-50 transition-colors`}>
                <div className="w-7 text-center text-slate-400 text-sm font-bold">{i+1}</div>
                {s.photo_url
                  ? <img src={s.photo_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                  : <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center text-white text-sm font-black flex-shrink-0">{s.full_name?.[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">{s.full_name}</div>
                  <div className="text-xs text-slate-400">Roll No. {s.roll_no}</div>
                </div>
                <div className="flex gap-1.5">
                  {(['present','absent','late','leave'] as StatusType[]).map(status => (
                    <button key={status} onClick={()=>setStatus(s.id, status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${attendance[s.id]===status ? STATUS_COLORS[status]+' border-current scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                      {STATUS_ICONS[status]}
                    </button>
                  ))}
                </div>
                <div className="w-16 text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border capitalize ${STATUS_COLORS[attendance[s.id]||'present']}`}>
                    {attendance[s.id]||'present'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5 text-base">
              {saving ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : <>💾 Save Attendance ({classStudents.length} students)</>}
            </button>
          </div>
        </>
      )}
      {classStudents.length === 0 && selClass && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-500">No students in Class {selClass}{selSection}. Add students first.</p>
        </div>
      )}
      {!selClass && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-slate-400 font-semibold">Select a class and click Load to mark attendance</p>
        </div>
      )}
    </div>
  )
}
