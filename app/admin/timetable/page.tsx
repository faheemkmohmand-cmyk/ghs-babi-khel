'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Entry = { id: string; class: string; day: string; period: number; subject: string; teacher_name: string; start_time: string; end_time: string }
type Teacher = { id: string; full_name: string; subject: string }

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const CLASSES = ['6','7','8','9','10']
const PERIODS = [
  { n:1, start:'08:00', end:'08:45' },
  { n:2, start:'08:45', end:'09:30' },
  { n:3, start:'09:30', end:'10:15' },
  { n:4, start:'10:30', end:'11:15' },
  { n:5, start:'11:15', end:'12:00' },
  { n:6, start:'12:00', end:'12:45' },
  { n:7, start:'13:30', end:'14:15' },
  { n:8, start:'14:15', end:'15:00' },
]

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':     'bg-blue-100 text-blue-900 border-blue-300',
  'Physics':         'bg-purple-100 text-purple-900 border-purple-300',
  'Chemistry':       'bg-green-100 text-green-900 border-green-300',
  'Biology':         'bg-emerald-100 text-emerald-900 border-emerald-300',
  'English':         'bg-amber-100 text-amber-900 border-amber-300',
  'Urdu':            'bg-rose-100 text-rose-900 border-rose-300',
  'Islamiat':        'bg-teal-100 text-teal-900 border-teal-300',
  'Pakistan Studies':'bg-orange-100 text-orange-900 border-orange-300',
  'Computer':        'bg-sky-100 text-sky-900 border-sky-300',
  'History':         'bg-yellow-100 text-yellow-900 border-yellow-300',
  'Geography':       'bg-lime-100 text-lime-900 border-lime-300',
  'Break':           'bg-slate-100 text-slate-500 border-slate-300',
  'Free Period':     'bg-slate-50 text-slate-400 border-slate-200',
}
function getColor(subject: string) {
  return SUBJECT_COLORS[subject] || 'bg-indigo-100 text-indigo-900 border-indigo-300'
}

export default function AdminTimetablePage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<Entry[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [selClass, setSelClass] = useState('6')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cell, setCell] = useState<{ day: string; period: number } | null>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [form, setForm] = useState({ subject: '', teacher_name: '', start_time: '', end_time: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: tt }, { data: tc }] = await Promise.all([
      supabase.from('timetable').select('*').eq('class', selClass).eq('section','A').order('day').order('period'),
      supabase.from('teachers').select('id,full_name,subject').eq('status','active').order('full_name'),
    ])
    setEntries(tt || [])
    setTeachers(tc || [])
    setLoading(false)
  }, [selClass])

  useEffect(() => { load() }, [load])

  function openCell(day: string, period: number) {
    const existing = entries.find(e => e.day === day && e.period === period)
    const p = PERIODS.find(p => p.n === period)!
    setCell({ day, period })
    setEditing(existing || null)
    setForm({
      subject: existing?.subject || '',
      teacher_name: existing?.teacher_name || '',
      start_time: existing?.start_time || p.start,
      end_time: existing?.end_time || p.end,
    })
    setShowModal(true)
  }

  async function save() {
    if (!form.subject) { toast.error('Subject required'); return }
    setSaving(true)
    try {
      const payload = { class: selClass, section: 'A', day: cell!.day, period: cell!.period, ...form }
      if (editing) {
        const { error } = await supabase.from('timetable').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('timetable').upsert(payload, { onConflict: 'class,section,day,period' })
        if (error) throw error
      }
      toast.success('Saved!')
      setShowModal(false)
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del() {
    if (!editing) return
    await supabase.from('timetable').delete().eq('id', editing.id)
    toast.success('Cleared')
    setShowModal(false)
    load()
  }

  const getEntry = (day: string, period: number) => entries.find(e => e.day === day && e.period === period)

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📅 Timetable Builder</h1>
            <p className="text-slate-500 text-sm">Click any cell to assign subject & teacher · {entries.length} periods scheduled</p>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {CLASSES.map(c => (
              <button key={c} onClick={() => setSelClass(c)}
                className={`px-4 py-2 text-sm font-black transition-all ${selClass === c ? 'bg-green-900 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                Class {c}
              </button>
            ))}
          </div>
        </div>

        {/* Subject legend */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SUBJECT_COLORS).slice(0,10).map(([subj, cls]) => (
            <span key={subj} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cls}`}>{subj}</span>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
            <div className="text-4xl mb-3 animate-pulse">📅</div>Loading...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{minWidth:'820px'}}>
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider w-24 border-r border-slate-700">Period</th>
                    {DAYS.map(d => (
                      <th key={d} className="px-2 py-3 text-center text-xs font-black uppercase tracking-wider border-r border-slate-700 last:border-0">
                        <div>{d.slice(0,3)}</div>
                        <div className="text-slate-400 font-normal text-xs normal-case">{d}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIODS.map((p) => (
                    <tr key={p.n} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2 border-r border-slate-100 bg-slate-50">
                        <div className="text-xs font-black text-slate-700">Period {p.n}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{p.start}–{p.end}</div>
                      </td>
                      {DAYS.map(day => {
                        const entry = getEntry(day, p.n)
                        return (
                          <td key={day} className="px-2 py-2 border-r border-slate-100 last:border-0">
                            <button
                              onClick={() => openCell(day, p.n)}
                              className={`w-full rounded-xl border transition-all hover:scale-[1.03] hover:shadow-md text-left px-2.5 py-2 min-h-[60px] flex flex-col justify-center ${
                                entry
                                  ? getColor(entry.subject)
                                  : 'bg-slate-50 border-dashed border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                              }`}>
                              {entry ? (
                                <>
                                  <div className="text-xs font-black leading-tight">{entry.subject}</div>
                                  {entry.teacher_name && (
                                    <div className="text-xs opacity-60 mt-1 truncate leading-tight">👤 {entry.teacher_name}</div>
                                  )}
                                </>
                              ) : (
                                <div className="text-slate-300 text-xs text-center w-full">＋</div>
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
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>Class {selClass} Timetable · Click any cell to edit</span>
              <span>{entries.length} / {DAYS.length * PERIODS.length} cells filled</span>
            </div>
          </div>
        )}
      </div>

      {showModal && cell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.55)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-black text-slate-800">{cell.day} · Period {cell.period}</h2>
                <p className="text-slate-400 text-xs">Class {selClass} · {PERIODS.find(p=>p.n===cell.period)?.start}–{PERIODS.find(p=>p.n===cell.period)?.end}</p>
              </div>
              {editing && <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-1 rounded-lg border border-green-200">Editing</span>}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject *</label>
                <input list="subj-list" value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Type or select subject"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 transition-colors"/>
                <datalist id="subj-list">
                  {Object.keys(SUBJECT_COLORS).map(s => <option key={s} value={s}/>)}
                  <option value="Free Period"/><option value="Lab"/><option value="Physical Education"/>
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Teacher</label>
                <input list="teacher-list" value={form.teacher_name}
                  onChange={e => setForm(p => ({ ...p, teacher_name: e.target.value }))}
                  placeholder="Select or type name"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 transition-colors"/>
                <datalist id="teacher-list">
                  {teachers.map(t => <option key={t.id} value={t.full_name}/>)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Start</label>
                  <input type="time" value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">End</label>
                  <input type="time" value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {editing && (
                <button onClick={del} className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold">
                  🗑️ Clear
                </button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
