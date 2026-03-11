'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Student = { id: string; full_name: string; roll_no: string; father_name: string }
type AttStatus = 'present' | 'absent' | 'late' | 'leave'
type Row = { student_id: string; status: AttStatus }

const CLASSES = ['6','7','8','9','10']
const STATUS_CONFIG: Record<AttStatus, { label: string; icon: string; active: string; inactive: string }> = {
  present: { label:'Present', icon:'✅', active:'bg-green-600 text-white border-green-600 shadow-green-200 shadow-md', inactive:'bg-white text-slate-400 border-slate-200 hover:border-green-400 hover:text-green-600' },
  absent:  { label:'Absent',  icon:'❌', active:'bg-red-500 text-white border-red-500 shadow-red-200 shadow-md',   inactive:'bg-white text-slate-400 border-slate-200 hover:border-red-400 hover:text-red-500' },
  late:    { label:'Late',    icon:'⏰', active:'bg-amber-500 text-white border-amber-500 shadow-amber-200 shadow-md', inactive:'bg-white text-slate-400 border-slate-200 hover:border-amber-400 hover:text-amber-500' },
  leave:   { label:'Leave',   icon:'🏠', active:'bg-sky-500 text-white border-sky-500 shadow-sky-200 shadow-md',   inactive:'bg-white text-slate-400 border-slate-200 hover:border-sky-400 hover:text-sky-500' },
}

export default function AdminAttendancePage() {
  const supabase = createClient()
  const [selClass, setSelClass] = useState('9')
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<'mark'|'report'>('mark')
  const [reportData, setReportData] = useState<any[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  async function loadStudents() {
    setLoading(true)
    setLoaded(false)
    const { data: studs, error: se } = await supabase
      .from('students').select('id,full_name,roll_no,father_name')
      .eq('class', selClass).eq('status','active').order('roll_no')
    if (se) { toast.error('Error loading students: ' + se.message); setLoading(false); return }

    const { data: existing } = await supabase
      .from('attendance').select('student_id,status')
      .eq('date', selDate).eq('class', selClass)

    const map = new Map((existing || []).map(r => [r.student_id, r.status as AttStatus]))
    setStudents(studs || [])
    setRows((studs || []).map(s => ({ student_id: s.id, status: map.get(s.id) || 'present' })))
    setLoaded(true)
    setLoading(false)
  }

  function setStatus(id: string, status: AttStatus) {
    setRows(prev => prev.map(r => r.student_id === id ? { ...r, status } : r))
  }

  function markAll(status: AttStatus) {
    setRows(prev => prev.map(r => ({ ...r, status })))
    toast.success(`All marked as ${status}`)
  }

  async function save() {
    if (!loaded || rows.length === 0) { toast.error('Load students first'); return }
    setSaving(true)
    try {
      const records = rows.map(r => ({
        student_id: r.student_id, date: selDate, status: r.status,
        class: selClass, section: 'A'
      }))
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,date' })
      if (error) throw error
      toast.success(`✅ Attendance saved for ${rows.length} students!`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function loadReport() {
    setReportLoading(true)
    const startOfMonth = selDate.slice(0, 7) + '-01'
    const { data } = await supabase
      .from('attendance').select('student_id, status, date')
      .eq('class', selClass)
      .gte('date', startOfMonth).lte('date', selDate)
      .order('date')

    const { data: studs } = await supabase
      .from('students').select('id,full_name,roll_no')
      .eq('class', selClass).eq('status','active').order('roll_no')

    if (!studs) { setReportLoading(false); return }

    const report = studs.map(s => {
      const attRows = (data || []).filter(r => r.student_id === s.id)
      const present = attRows.filter(r => r.status === 'present').length
      const absent  = attRows.filter(r => r.status === 'absent').length
      const late    = attRows.filter(r => r.status === 'late').length
      const leave   = attRows.filter(r => r.status === 'leave').length
      const total   = attRows.length
      const pct     = total > 0 ? Math.round((present / total) * 100) : 0
      return { ...s, present, absent, late, leave, total, pct }
    })
    setReportData(report)
    setReportLoading(false)
  }

  useEffect(() => { if (viewMode === 'report') loadReport() }, [viewMode, selClass, selDate])

  const counts = {
    present: rows.filter(r => r.status === 'present').length,
    absent:  rows.filter(r => r.status === 'absent').length,
    late:    rows.filter(r => r.status === 'late').length,
    leave:   rows.filter(r => r.status === 'leave').length,
  }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">✅ Attendance</h1>
            <p className="text-slate-500 text-sm">Mark daily attendance or view monthly report</p>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setViewMode('mark')} className={`px-4 py-2 text-sm font-black transition-all ${viewMode==='mark'?'bg-green-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>✍️ Mark</button>
            <button onClick={() => setViewMode('report')} className={`px-4 py-2 text-sm font-black transition-all ${viewMode==='report'?'bg-green-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>📊 Report</button>
          </div>
        </div>

        {/* Selector Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Class</label>
            <div className="flex gap-1.5">
              {CLASSES.map(c => (
                <button key={c} onClick={() => { setSelClass(c); setLoaded(false) }}
                  className={`w-10 h-10 rounded-xl text-sm font-black border-2 transition-all ${selClass===c?'bg-slate-900 text-white border-slate-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
            <input type="date" value={selDate}
              onChange={e => { setSelDate(e.target.value); setLoaded(false) }}
              className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors font-semibold"/>
          </div>
          {viewMode === 'mark' && (
            <button onClick={loadStudents} disabled={loading}
              className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
              {loading ? 'Loading...' : '📋 Load Students'}
            </button>
          )}
        </div>

        {/* MARK MODE */}
        {viewMode === 'mark' && (
          <>
            {loaded && rows.length > 0 && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-3">
                  {(Object.keys(STATUS_CONFIG) as AttStatus[]).map(st => (
                    <div key={st} className={`rounded-2xl p-4 text-center border-2 ${
                      st==='present'?'bg-green-50 border-green-200':
                      st==='absent'?'bg-red-50 border-red-200':
                      st==='late'?'bg-amber-50 border-amber-200':
                      'bg-sky-50 border-sky-200'
                    }`}>
                      <div className="text-2xl mb-1">{STATUS_CONFIG[st].icon}</div>
                      <div className={`font-display text-3xl font-black ${
                        st==='present'?'text-green-700':st==='absent'?'text-red-600':
                        st==='late'?'text-amber-700':'text-sky-700'
                      }`}>{counts[st]}</div>
                      <div className="text-xs font-bold text-slate-500 mt-0.5">{STATUS_CONFIG[st].label}</div>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-400 self-center mr-1">Quick mark:</span>
                  {(Object.keys(STATUS_CONFIG) as AttStatus[]).map(st => (
                    <button key={st} onClick={() => markAll(st)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${STATUS_CONFIG[st].inactive}`}>
                      {STATUS_CONFIG[st].icon} All {STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>

                {/* Student list */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wide">Class {selClass} · {students.length} Students · {selDate}</span>
                    <span className="text-xs text-slate-400">{Math.round(counts.present/students.length*100)}% Present</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {rows.map((row, i) => {
                      const student = students.find(s => s.id === row.student_id)!
                      return (
                        <div key={row.student_id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                          row.status==='absent'?'bg-red-50/30':row.status==='late'?'bg-amber-50/30':''
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center flex-shrink-0">
                            {student?.roll_no || i+1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm">{student?.full_name}</p>
                            <p className="text-slate-400 text-xs">{student?.father_name ? `S/O ${student.father_name}` : ''}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {(Object.keys(STATUS_CONFIG) as AttStatus[]).map(st => (
                              <button key={st} onClick={() => setStatus(row.student_id, st)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-black border-2 transition-all ${
                                  row.status === st ? STATUS_CONFIG[st].active : STATUS_CONFIG[st].inactive
                                }`}>
                                {STATUS_CONFIG[st].icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Save button */}
                <button onClick={save} disabled={saving}
                  className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg flex items-center justify-center gap-2">
                  {saving && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  💾 Save Attendance — Class {selClass} · {selDate}
                </button>
              </>
            )}
            {!loaded && !loading && (
              <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-slate-500 font-semibold">Select class & date, then click Load Students</p>
              </div>
            )}
          </>
        )}

        {/* REPORT MODE */}
        {viewMode === 'report' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Class {selClass} · Monthly Report · {selDate.slice(0,7)}</p>
            </div>
            {reportLoading ? (
              <div className="text-center py-16 text-slate-400">Loading report...</div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No attendance data for this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['Roll','Student','Present','Absent','Late','Leave','Total','%'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reportData.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 font-bold text-xs">{s.roll_no}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{s.full_name}</td>
                        <td className="px-4 py-3 text-green-700 font-bold">{s.present}</td>
                        <td className="px-4 py-3 text-red-600 font-bold">{s.absent}</td>
                        <td className="px-4 py-3 text-amber-600 font-bold">{s.late}</td>
                        <td className="px-4 py-3 text-sky-600 font-bold">{s.leave}</td>
                        <td className="px-4 py-3 text-slate-600">{s.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${s.pct>=75?'bg-green-500':s.pct>=50?'bg-amber-500':'bg-red-500'}`} style={{width:`${s.pct}%`}}/>
                            </div>
                            <span className={`text-xs font-black ${s.pct>=75?'text-green-700':s.pct>=50?'text-amber-600':'text-red-600'}`}>{s.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
