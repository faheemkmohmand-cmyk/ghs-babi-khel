'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Achievement = { id: string; title: string; description: string; category: string; year: string; recipient: string; awarded_by: string; icon: string; featured: boolean }

const CATEGORIES = ['academic','sports','science','extracurricular','environment']
const ICONS = ['🏆','🥇','🎖️','🏅','⭐','🎓','🔬','⚽','🌱','🎨']

export default function AdminAchievementsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', category:'academic', year:new Date().getFullYear().toString(), recipient:'', awarded_by:'', icon:'🏆', featured:false })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('achievements').select('*').order('year', { ascending:false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm({ title:'', description:'', category:'academic', year:new Date().getFullYear().toString(), recipient:'', awarded_by:'', icon:'🏆', featured:false }); setShowForm(true) }
  function openEdit(a: Achievement) { setEditing(a); setForm({ title:a.title, description:a.description, category:a.category, year:a.year, recipient:a.recipient, awarded_by:a.awarded_by, icon:a.icon||'🏆', featured:a.featured }); setShowForm(true) }

  async function save() {
    if (!form.title || !form.recipient) { toast.error('Title and recipient required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('achievements').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Updated!')
      } else {
        const { error } = await supabase.from('achievements').insert(form)
        if (error) throw error; toast.success('Achievement added!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('achievements').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const catColor: Record<string,string> = { academic:'bg-green-50 text-green-700', sports:'bg-sky-50 text-sky-700', science:'bg-purple-50 text-purple-700', extracurricular:'bg-amber-50 text-amber-700', environment:'bg-emerald-50 text-emerald-700' }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-black text-slate-800">🏆 Achievements</h1><p className="text-slate-500 text-sm">{items.length} achievements</p></div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Add Achievement</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-3 text-center py-16 text-slate-400">Loading...</div>
          : items.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-slate-100 text-center py-16">
              <div className="text-5xl mb-3">🏆</div><p className="text-slate-400 font-semibold">No achievements yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Add First Achievement</button>
            </div>
          ) : items.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{a.icon}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${catColor[a.category]||'bg-slate-100 text-slate-600'}`}>{a.category}</span>
              </div>
              <h3 className="font-black text-slate-800 mb-1">{a.title}</h3>
              <p className="text-slate-500 text-sm mb-2 line-clamp-2">{a.description}</p>
              <p className="text-slate-400 text-xs">🎓 {a.recipient} · {a.year}</p>
              <p className="text-slate-400 text-xs">🏛️ {a.awarded_by}</p>
              {a.featured && <span className="mt-2 inline-block text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200">⭐ Featured</span>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(a)} className="flex-1 text-xs font-bold text-sky-600 border border-sky-200 py-1.5 rounded-lg hover:bg-sky-50">Edit</button>
                <button onClick={() => del(a.id)} className="flex-1 text-xs font-bold text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Achievement' : 'Add Achievement'}</h2>
            <div className="space-y-3">
              {[{label:'Title *',key:'title',ph:'Achievement title'},{label:'Recipient *',key:'recipient',ph:'Student/Team name'},{label:'Awarded By',key:'awarded_by',ph:'Organization/Institution'}].map(f => (
                <div key={f.key}><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              ))}
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Year</label>
                  <input value={form.year} onChange={e => setForm(p => ({...p,year:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Icon</label>
                <div className="flex gap-2 flex-wrap">{ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm(p => ({...p,icon:ic}))}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${form.icon===ic?'bg-green-100 ring-2 ring-green-400':'hover:bg-slate-100'}`}>{ic}</button>
                ))}</div></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500"/>
                <span className="text-sm font-bold text-slate-700">Featured on homepage</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update':'Add')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
