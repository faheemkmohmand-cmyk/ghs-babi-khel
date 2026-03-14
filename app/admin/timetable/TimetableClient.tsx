'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'

const supabase = createClient()

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const CLASSES = ['6','7','8','9','10']
const SECTIONS = ['A','B','C']
const PERIODS = [
  { num:1, start:'8:00', end:'8:45' },
  { num:2, start:'8:45', end:'9:30' },
  { num:3, start:'9:30', end:'10:15' },
  { num:4, start:'10:30', end:'11:15' },
  { num:5, start:'11:15', end:'12:00' },
  { num:6, start:'12:00', end:'12:45' },
  { num:7, start:'1:30', end:'2:15' },
]
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer Science','General Science','Social Studies','Arabic','Physical Education','Art']

type Slot = { id:string; class:string; section:string; day:string; period:number; subject:string; teacher_id?:string; start_time:string; end_time:string }
type Teacher = { id:string; full_name:string; subject:string }

export default function TimetableClient({ initialSlots, teachers }: { initialSlots:Slot[]; teachers:Teacher[] }) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [selClass, setSelClass] = useState('9')
  const [selSection, setSelSection] = useState('A')
  const [editSlot, setEditSlot] = useState<{day:string;period:number}|null>(null)
  const [form, setForm] = useState({ subject:'', teacher_id:'' })
  const [saving, setSaving] = useState(false)

  const getSlot = (day:string, period:number) =>
    slots.find(s => s.class===selClass && s.section===selSection && s.day===day && s.period===period)

  function openEdit(day:string, period:number) {
    const existing = getSlot(day, period)
    setForm({ subject: existing?.subject||'', teacher_id: existing?.teacher_id||'' })
    setEditSlot({day, period})
  }

  async function handleSave() {
    if (!form.subject) { toast.error('Select a subject'); return }
    const period = PERIODS.find(p => p.num === editSlot!.period)!
    setSaving(true)
    try {
      const payload = {
        class: selClass, section: selSection,
        day: editSlot!.day, period: editSlot!.period,
        subject: form.subject,
        teacher_id: form.teacher_id || null,
        start_time: period.start, end_time: period.end,
      }
      const existing = getSlot(editSlot!.day, editSlot!.period)
      if (existing) {
        const { data, error } = await supabase.from('timetable').update(payload).eq('id', existing.id).select().single()
        if (error) { toast.error(error.message); return }
        setSlots(prev => prev.map(s => s.id === existing.id ? data : s))
      } else {
        const { data, error } = await supabase.from('timetable').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setSlots(prev => [...prev, data])
      }
      toast.success('Period saved ✅')
      setEditSlot(null)
    } finally { setSaving(false) }
  }

  async function handleClear() {
    const existing = getSlot(editSlot!.day, editSlot!.period)
    if (!existing) { setEditSlot(null); return }
    await supabase.from('timetable').delete().eq('id', existing.id)
    setSlots(prev => prev.filter(s => s.id !== existing.id))
    toast.success('Period cleared')
    setEditSlot(null)
  }

  async function copyDayToAll(fromDay: string) {
    const daySlots = slots.filter(s => s.class===selClass && s.section===selSection && s.day===fromDay)
    if (daySlots.length === 0) { toast.error('No periods set for this day'); return }
    setSaving(true)
    try {
      for (const otherDay of DAYS.filter(d => d !== fromDay)) {
        const records = daySlots.map(s => ({ ...s, day: otherDay, id: undefined }))
        await supabase.from('timetable').upsert(records, { onConflict: 'class,section,day,period' })
      }
      const { data } = await supabase.from('timetable').select('*').eq('class', selClass).eq('section', selSection)
      if (data) setSlots(prev => [...prev.filter(s => !(s.class===selClass && s.section===selSection)), ...data])
      toast.success('Schedule copied to all days ✅')
    } finally { setSaving(false) }
  }

  const subjectColors: Record<string,string> = {
    'Mathematics':'bg-blue-50 border-blue-200 text-blue-800',
    'Physics':'bg-purple-50 border-purple-200 text-purple-800',
    'Chemistry':'bg-green-50 border-green-200 text-green-800',
    'Biology':'bg-emerald-50 border-emerald-200 text-emerald-800',
    'English':'bg-rose-50 border-rose-200 text-rose-800',
    'Urdu':'bg-amber-50 border-amber-200 text-amber-800',
    'Islamiat':'bg-teal-50 border-teal-200 text-teal-800',
    'Pakistan Studies':'bg-orange-50 border-orange-200 text-orange-800',
    'Computer Science':'bg-cyan-50 border-cyan-200 text-cyan-800',
    'General Science':'bg-lime-50 border-lime-200 text-lime-800',
    'Physical Education':'bg-red-50 border-red-200 text-red-800',
  }
  const getColor = (sub:string) => subjectColors[sub] || 'bg-slate-50 border-slate-200 text-slate-700'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📅 Timetable Builder</h1>
          <p className="text-slate-500 text-sm mt-0.5">Click any cell to set or edit a period</p>
        </div>
      </div>

      {/* Class selector */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class</label>
          <div className="flex gap-1.5">
            {CLASSES.map(c => (
              <button key={c} onClick={()=>setSelClass(c)}
                className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all border-2 ${selClass===c?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Section</label>
          <div className="flex gap-1.5">
            {SECTIONS.map(s => (
              <button key={s} onClick={()=>setSelSection(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-black transition-all border-2 ${selSection===s?'bg-green-900 text-white border-green-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Copy Monday to all days</p>
          <button onClick={()=>copyDayToAll('Monday')} disabled={saving}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-1.5 rounded-xl transition-all">
            📋 Copy Mon → All
          </button>
        </div>
      </div>

      {/* Timetable grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest w-28">Period</th>
                {DAYS.map(d => (
                  <th key={d} className="px-3 py-3 text-center text-xs font-black uppercase tracking-widest">{d.slice(0,3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p, pi) => (
                <tr key={p.num} className={pi % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2 border-b border-slate-100">
                    <div className="font-black text-slate-700 text-sm">P{p.num}</div>
                    <div className="text-xs text-slate-400">{p.start}–{p.end}</div>
                  </td>
                  {DAYS.map(day => {
                    const slot = getSlot(day, p.num)
                    const teacher = slot?.teacher_id ? teachers.find(t=>t.id===slot.teacher_id) : null
                    return (
                      <td key={day} className="px-2 py-2 border-b border-l border-slate-100">
                        <button onClick={()=>openEdit(day, p.num)}
                          className={`w-full rounded-xl p-2 text-left transition-all hover:shadow-md border-2 min-h-[60px] ${slot ? getColor(slot.subject) : 'bg-slate-50 border-dashed border-slate-200 hover:border-slate-400'}`}>
                          {slot ? (
                            <>
                              <div className="font-black text-xs leading-tight">{slot.subject}</div>
                              {teacher && <div className="text-xs opacity-60 mt-0.5 truncate">{teacher.full_name.split(' ').slice(-1)[0]}</div>}
                            </>
                          ) : (
                            <div className="text-slate-300 text-xs text-center w-full">+ Add</div>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(subjectColors).slice(0,8).map(([sub, cls]) => (
          <span key={sub} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cls}`}>{sub}</span>
        ))}
      </div>

      {/* Edit Modal */}
      {editSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>
                  {editSlot.day} · Period {editSlot.period}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Class {selClass}{selSection} · {PERIODS.find(p=>p.num===editSlot.period)?.start}–{PERIODS.find(p=>p.num===editSlot.period)?.end}</p>
              </div>
              <button onClick={()=>setEditSlot(null)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject *</label>
                <select value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="">-- Select Subject --</option>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Teacher (Optional)</label>
                <select value={form.teacher_id} onChange={e=>setForm(p=>({...p,teacher_id:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="">-- No teacher assigned --</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name} ({t.subject})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-100">
              {getSlot(editSlot.day, editSlot.period) && (
                <button onClick={handleClear} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all">🗑️ Clear</button>
              )}
              <button onClick={()=>setEditSlot(null)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✅'} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
