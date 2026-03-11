'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Exam = { id: string; name: string; type: string; classes: string[]; start_date: string; end_date: string; status: string; venue: string; time_slot: string }

export default function AdminExamsPage() {
  const supabase = createClient()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Exam | null>(null)
  const [form, setForm] = useState({ name:'', type:'monthly', classes:['6','7','8','9','10'], start_date:'', end_date:'', status:'upcoming', venue:'Examination Hall', time_slot:'8:00 AM - 11:00 AM' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('exams').select('*').order('start_date', { ascending: false })
    setExams(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm({ name:'', type:'monthly', classes:['6','7','8','9','10'], start_date:'', end_date:'', status:'upcoming', venue:'Examination Hall', time_slot:'8:00 AM - 11:00 AM' }); setShowForm(true) }
  function openEdit(e: Exam) { setEditing(e); setForm({ name:e.name, type:e.type, classes:e.classes, start_date:e.start_date, end_date:e.end_date, status:e.status, venue:e.venue||'Examination Hall', time_slot:e.time_slot||'8:00 AM - 11:00 AM' }); setShowForm(true) }

  async function save() {
    if (!form.name || !form.start_date || !form.end_date) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('exams').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Exam updated!')
      } else {
        const { error } = await supabase.from('exams').insert(form)
        if (error) throw error; toast.success('Exam scheduled!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete exam?')) return
    await supabase.from('exams').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const statusColor: Record<string,string> = { upcoming:'bg-amber-50 text-amber-700 border-amber-200', ongoing:'bg-green-50 text-green-700 border-green-200', completed:'bg-slate-100 text-slate-600 border-slate-200' }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-black text-slate-800">📝 Exam Schedule</h1><p className="text-slate-500 text-sm">{exams.length} exams scheduled</p></div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Schedule Exam</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-3 text-center py-16 text-slate-400">Loading...</div>
          : exams.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-slate-100 text-center py-16">
              <div className="text-5xl mb-3">📝</div><p className="text-slate-400 font-semibold">No exams scheduled</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Schedule First Exam</button>
            </div>
          ) : exams.map(ex => (
            <div key={ex.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${statusColor[ex.status]||'bg-slate-100 text-slate-600 border-slate-200'}`}>{ex.status.toUpperCase()}</span>
                <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">{ex.type}</span>
              </div>
              <h3 className="font-black text-slate-800 mb-2">{ex.name}</h3>
              <div className="space-y-1 text-sm text-slate-500 mb-3">
                <p>📅 {ex.start_date} → {ex.end_date}</p>
                <p>🕐 {ex.time_slot}</p>
                <p>📍 {ex.venue}</p>
                <p>🏫 Classes: {ex.classes?.join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(ex)} className="flex-1 text-xs font-bold text-sky-600 border border-sky-200 py-1.5 rounded-lg hover:bg-sky-50">Edit</button>
                <button onClick={() => del(ex.id)} className="flex-1 text-xs font-bold text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Exam' : 'Schedule Exam'}</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Exam Name *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Annual Exam 2024"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['monthly','halfyearly','board','annual'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['upcoming','ongoing','completed'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p=>({...p,start_date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p=>({...p,end_date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Venue</label>
                <input value={form.venue} onChange={e => setForm(p=>({...p,venue:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Time Slot</label>
                <input value={form.time_slot} onChange={e => setForm(p=>({...p,time_slot:e.target.value}))} placeholder="e.g. 8:00 AM - 11:00 AM" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update':'Schedule')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
