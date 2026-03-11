'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type TimetableEntry = { id: string; class: string; section: string; day: string; period: number; subject: string; start_time: string; end_time: string }

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const CLASSES = ['6','7','8','9','10']
const SECTIONS = ['A','B','C']
const PERIODS = [1,2,3,4,5,6,7,8]

export default function AdminTimetablePage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selClass, setSelClass] = useState('6')
  const [selSection, setSelSection] = useState('A')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<TimetableEntry | null>(null)
  const [form, setForm] = useState({ day:'Monday', period:1, subject:'', start_time:'08:00', end_time:'08:45' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('timetable').select('*')
      .eq('class', selClass).eq('section', selSection).order('day').order('period')
    setEntries(data || [])
    setLoading(false)
  }, [selClass, selSection])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ day:'Monday', period:1, subject:'', start_time:'08:00', end_time:'08:45' })
    setShowForm(true)
  }
  function openEdit(e: TimetableEntry) {
    setEditing(e)
    setForm({ day:e.day, period:e.period, subject:e.subject, start_time:e.start_time, end_time:e.end_time })
    setShowForm(true)
  }

  async function save() {
    if (!form.subject) { toast.error('Subject required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('timetable').update({ ...form, class:selClass, section:selSection }).eq('id', editing.id)
        if (error) throw error
        toast.success('Updated!')
      } else {
        const { error } = await supabase.from('timetable').upsert({ ...form, class:selClass, section:selSection }, { onConflict:'class,section,day,period' })
        if (error) throw error
        toast.success('Period added!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this period?')) return
    await supabase.from('timetable').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter(e => e.day === day).sort((a,b) => a.period - b.period)
    return acc
  }, {} as Record<string, TimetableEntry[]>)

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📅 Timetable</h1>
            <p className="text-slate-500 text-sm">Manage class schedules</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">+ Add Period</button>
        </div>

        <div className="flex gap-3">
          <select value={selClass} onChange={e => setSelClass(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={selSection} onChange={e => setSelSection(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
            {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>

        {loading ? <div className="text-center py-16 text-slate-400">Loading...</div> : (
          <div className="space-y-4">
            {DAYS.map(day => (
              <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                  <h3 className="font-black text-slate-800">{day}</h3>
                </div>
                {byDay[day].length === 0 ? (
                  <div className="px-5 py-4 text-slate-400 text-sm">No periods scheduled</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {byDay[day].map(e => (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                        <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 text-xs font-black flex items-center justify-center flex-shrink-0">{e.period}</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">{e.subject}</p>
                          <p className="text-slate-400 text-xs">{e.start_time} – {e.end_time}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(e)} className="text-xs font-bold text-sky-600 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50">Edit</button>
                          <button onClick={() => del(e.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Period' : 'Add Period'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Day</label>
                  <select value={form.day} onChange={e => setForm(p => ({...p, day:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Period</label>
                  <select value={form.period} onChange={e => setForm(p => ({...p, period:parseInt(e.target.value)}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject *</label>
                <input value={form.subject} onChange={e => setForm(p => ({...p, subject:e.target.value}))} placeholder="e.g. Mathematics"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(p => ({...p, start_time:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(p => ({...p, end_time:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving ? 'Saving...' : (editing ? 'Update' : 'Add Period')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
