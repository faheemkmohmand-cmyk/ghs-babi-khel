'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


const CLASSES = ['6','7','8','9','10']
type ExamDay = { date:string; subject:string; classes:string }
type Exam = { id:string; name:string; type:string; classes:string[]; start_date:string; end_date:string; status:string; venue:string; time_slot:string; schedule:ExamDay[]; created_at:string }
const emptyForm = { name:'', type:'annual', classes:[] as string[], start_date:'', end_date:'', status:'upcoming', venue:'Examination Hall', time_slot:'8:00 AM - 11:00 AM', schedule:[] as ExamDay[] }
const statusColors: Record<string,string> = { upcoming:'bg-blue-50 text-blue-700 border-blue-200', ongoing:'bg-green-50 text-green-700 border-green-200', completed:'bg-slate-100 text-slate-600 border-slate-200' }
const typeLabels: Record<string,string> = { monthly:'Monthly Test', halfyearly:'Half-Yearly', board:'Board Exam', annual:'Annual Exam' }

export default function ExamsClient({ initialExams }: { initialExams:Exam[] }) {
  const supabase = createClient()

  const [exams, setExams] = useState<Exam[]>(initialExams)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Exam|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [scheduleRows, setScheduleRows] = useState<ExamDay[]>([{ date:'', subject:'', classes:'' }])
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setScheduleRows([{ date:'', subject:'', classes:'' }])
    setShowModal(true)
  }
  function openEdit(e: Exam) {
    setEditing(e)
    setForm({ name:e.name, type:e.type, classes:e.classes, start_date:e.start_date, end_date:e.end_date, status:e.status, venue:e.venue, time_slot:e.time_slot, schedule:e.schedule })
    setScheduleRows(e.schedule?.length ? e.schedule : [{ date:'', subject:'', classes:'' }])
    setShowModal(true)
  }
  function toggleClass(c:string) {
    setForm(p => ({ ...p, classes: p.classes.includes(c) ? p.classes.filter(x=>x!==c) : [...p.classes, c] }))
  }
  function addRow() { setScheduleRows(p => [...p, { date:'', subject:'', classes:'' }]) }
  function updateRow(i:number, k:keyof ExamDay, v:string) {
    setScheduleRows(p => {
      const next = [...p]
      next[i] = { ...next[i], [k]: v }
      return next
    })
  }
  function removeRow(i:number) { setScheduleRows(p => p.filter((_,idx)=>idx!==i)) }

  async function handleSave() {
    if (!form.name || !form.start_date || !form.end_date || form.classes.length===0) {
      toast.error('Fill exam name, dates and select at least one class'); return
    }
    setSaving(true)
    try {
      const payload = { ...form, schedule: scheduleRows.filter(r=>r.date&&r.subject) }
      if (editing) {
        const { data, error } = await supabase.from('exams').update(payload).eq('id', editing.id).select().single() as any
        if (error) { toast.error(error.message); return }
        setExams(prev => prev.map(e => e.id===editing.id ? data : e))
        toast.success('Exam updated ✅')
      } else {
        const { data, error } = await supabase.from('exams').insert(payload).select().single() as any
        if (error) { toast.error(error.message); return }
        setExams(prev => [data, ...prev])
        toast.success('Exam schedule created ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string, name:string) {
    if (!confirm(`Delete "${name}"?`)) return
    await supabase.from('exams').delete().eq('id', id)
    setExams(prev => prev.filter(e=>e.id!==id))
    toast.success('Exam deleted')
  }

  async function updateStatus(id:string, status:string) {
    const { data } = await supabase.from('exams').update({ status } as any).eq('id', id).select().single() as any
    if (data) { setExams(prev => prev.map(e=>e.id===id?data:e)); toast.success(`Status → ${status}`) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📝 Exam Schedule</h1>
          <p className="text-slate-500 text-sm mt-0.5">{exams.length} exams · {exams.filter(e=>e.status==='upcoming').length} upcoming</p>
        </div>
        <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Create Exam Schedule
        </button>
      </div>

      <div className="space-y-4">
        {exams.length===0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-slate-500 font-semibold">No exam schedules yet. Create your first one!</p>
          </div>
        ) : exams.map(e => {
          const daysLeft = Math.ceil((new Date(e.start_date).getTime()-Date.now())/86400000)
          return (
            <div key={e.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="p-5 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-slate-800 text-lg" style={{fontFamily:'Georgia,serif'}}>{e.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusColors[e.status]}`}>{e.status}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg">{typeLabels[e.type]||e.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                    <span>📅 {e.start_date} → {e.end_date}</span>
                    <span>🏛️ {e.venue}</span>
                    <span>⏰ {e.time_slot}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.classes.map(c=>(
                      <span key={c} className="bg-slate-800 text-white text-xs font-black px-2 py-0.5 rounded-lg">Class {c}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {daysLeft > 0 && e.status==='upcoming' && (
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${daysLeft<=7?'bg-red-50 text-red-600':daysLeft<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>
                      {daysLeft}d left
                    </span>
                  )}
                  <select value={e.status} onChange={ev=>updateStatus(e.id,ev.target.value)}
                    className="border-2 border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none focus:border-green-500 bg-white">
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={()=>openEdit(e)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors">✏️</button>
                  <button onClick={()=>handleDelete(e.id,e.name)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
              {e.schedule?.length > 0 && (
                <div className="border-t border-slate-100 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Classes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.schedule.map((row,i)=>(
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                          <td className="px-4 py-2 text-sm text-slate-600">{row.date}</td>
                          <td className="px-4 py-2 text-sm font-bold text-slate-800">{row.subject}</td>
                          <td className="px-4 py-2 text-sm text-slate-500">{row.classes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'✏️ Edit Exam':'📝 Create Exam Schedule'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Name *</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Annual Examination 2025"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="annual">Annual</option><option value="halfyearly">Half-Yearly</option>
                    <option value="monthly">Monthly Test</option><option value="board">Board Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Venue</label>
                  <input value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))} placeholder="Examination Hall"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Time Slot</label>
                  <input value={form.time_slot} onChange={e=>setForm(p=>({...p,time_slot:e.target.value}))} placeholder="8:00 AM - 11:00 AM"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Classes *</label>
                <div className="flex gap-2 flex-wrap">
                  {CLASSES.map(c=>(
                    <button key={c} type="button" onClick={()=>toggleClass(c)}
                      className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${form.classes.includes(c)?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Date-wise Schedule (Optional)</label>
                  <button onClick={addRow} type="button" className="text-green-900 text-xs font-black hover:underline">+ Add Row</button>
                </div>
                <div className="space-y-2">
                  {scheduleRows.map((row,i)=>(
                    <div key={`row-${i}`} className="grid grid-cols-3 gap-2 items-center">
                      <input type="date" defaultValue={row.date} onBlur={e=>updateRow(i,'date',e.target.value)}
                        className="border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500" />
                      <input defaultValue={row.subject} onBlur={e=>updateRow(i,'subject',e.target.value)} placeholder="Subject name"
                        className="border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500" />
                      <div className="flex gap-1.5">
                        <input defaultValue={row.classes} onBlur={e=>updateRow(i,'classes',e.target.value)} placeholder="9,10 or All"
                          className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500" />
                        <button onClick={()=>removeRow(i)} className="text-red-400 hover:text-red-600 px-2 text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
                {editing ? '✅ Update' : '📝 Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
