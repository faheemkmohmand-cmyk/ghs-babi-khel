'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Student = { id: string; full_name: string; roll_no: string; class: string; section: string }
type AttendanceRecord = { student_id: string; status: string }

export default function AdminAttendancePage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selClass, setSelClass] = useState('6')
  const [selSection, setSelSection] = useState('A')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('students').select('id,full_name,roll_no,class,section')
      .eq('class', selClass).eq('section', selSection).eq('status','active').order('roll_no')
    setStudents(data || [])

    // Load existing attendance for this date
    const ids = (data || []).map((s: Student) => s.id)
    if (ids.length > 0) {
      const { data: att } = await supabase.from('attendance').select('student_id,status').eq('date', date).in('student_id', ids)
      const map: Record<string, string> = {}
      ;(data || []).forEach((s: Student) => { map[s.id] = 'present' })
      ;(att || []).forEach((a: AttendanceRecord) => { map[a.student_id] = a.status })
      setAttendance(map)
    } else {
      setAttendance({})
    }
    setLoading(false)
  }, [selClass, selSection, date])

  useEffect(() => { loadStudents() }, [loadStudents])

  function setStatus(id: string, status: string) {
    setAttendance(p => ({ ...p, [id]: status }))
  }

  function markAll(status: string) {
    const map: Record<string, string> = {}
    students.forEach(s => { map[s.id] = status })
    setAttendance(map)
  }

  async function saveAttendance() {
    if (students.length === 0) { toast.error('No students found'); return }
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.id, date, status: attendance[s.id] || 'present',
        class: selClass, section: selSection
      }))
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
      if (error) throw error
      toast.success(`Attendance saved for ${students.length} students!`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const statusColor: Record<string, string> = { present:'bg-green-500', absent:'bg-red-500', late:'bg-amber-500', leave:'bg-sky-500' }
  const statusBg: Record<string, string> = { present:'bg-green-50 border-green-300 text-green-700', absent:'bg-red-50 border-red-300 text-red-700', late:'bg-amber-50 border-amber-300 text-amber-700', leave:'bg-sky-50 border-sky-300 text-sky-700' }

  const presentCount = Object.values(attendance).filter(v => v === 'present').length
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800">✅ Attendance</h1>
          <p className="text-slate-500 text-sm">Mark daily attendance for each class</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
              <select value={selClass} onChange={e => setSelClass(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Section</label>
              <select value={selSection} onChange={e => setSelSection(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {students.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-slate-600">Mark All:</span>
              {['present','absent','late','leave'].map(s => (
                <button key={s} onClick={() => markAll(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${statusBg[s]}`}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
              <div className="ml-auto flex gap-3 text-sm">
                <span className="font-bold text-green-700">✅ {presentCount} Present</span>
                <span className="font-bold text-red-600">❌ {absentCount} Absent</span>
              </div>
            </div>
          )}
        </div>

        {/* Student List */}
        {loading ? <div className="text-center py-16 text-slate-400">Loading students...</div>
        : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">🎓</div>
            <p className="text-slate-400 font-semibold">No students in Class {selClass}{selSection}</p>
            <p className="text-slate-400 text-sm mt-1">Add students first from the Students section</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {students.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <span className="text-slate-400 text-sm font-bold w-8">{i+1}</span>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-black flex-shrink-0">
                      {s.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{s.full_name}</p>
                      <p className="text-slate-400 text-xs">Roll No: {s.roll_no}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {['present','absent','late','leave'].map(status => (
                        <button key={status} onClick={() => setStatus(s.id, status)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 transition-all ${
                            attendance[s.id] === status ? statusBg[status] + ' scale-105' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}>
                          {status.charAt(0).toUpperCase()+status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={saveAttendance} disabled={saving}
              className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all">
              {saving ? 'Saving Attendance...' : `💾 Save Attendance for Class ${selClass}${selSection} — ${date}`}
            </button>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
