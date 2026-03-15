'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


const CATEGORIES = ['Academic','Sports','Arts','Science','Debate','Community','Technology','Other']
const LEVELS = ['School','District','Provincial','National','International']

type Achievement = {
  id:string; title:string; description:string; category:string; level:string
  student_name:string; class:string; date:string; prize?:string
  photo_url?:string; featured:boolean; created_at:string
}
const emptyForm = {
  title:'', description:'', category:'Academic', level:'School',
  student_name:'', class:'', date:new Date().toISOString().split('T')[0],
  prize:'', featured:false
}

export default function AchievementsClient({ initialAchievements }: { initialAchievements:Achievement[] }) {
  const supabase = createClient()

  const [items, setItems] = useState<Achievement[]>(initialAchievements)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Achievement|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('')

  const filtered = items.filter(a => !filterCat || a.category === filterCat)

  function openAdd() { setEditing(null); setForm(emptyForm); setPhotoFile(null); setShowModal(true) }
  function openEdit(a:Achievement) {
    setEditing(a); setPhotoFile(null)
    setForm({ title:a.title, description:a.description, category:a.category, level:a.level, student_name:a.student_name, class:a.class, date:a.date, prize:a.prize||'', featured:a.featured })
    setShowModal(true)
  }

  async function uploadPhoto(id:string): Promise<string|null> {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const { error } = await supabase.storage.from('gallery').upload(`achievements/${id}.${ext}`, photoFile, {upsert:true})
    if (error) return null
    return supabase.storage.from('gallery').getPublicUrl(`achievements/${id}.${ext}`).data.publicUrl
  }

  async function handleSave() {
    if (!form.title || !form.student_name) { toast.error('Title and student name required'); return }
    setSaving(true)
    try {
      const tmpId = editing?.id || crypto.randomUUID()
      let photo_url = editing?.photo_url || null
      if (photoFile) { const url = await uploadPhoto(tmpId); if (url) photo_url = url }
      if (editing) {
        const { data, error } = await (supabase as any).from('achievements').update({...form, photo_url}).eq('id', editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setItems(prev => prev.map(a => a.id===editing.id ? data : a))
        toast.success('Achievement updated ✅')
      } else {
        const { data, error } = await (supabase as any).from('achievements').insert({...form, photo_url}).select().single()
        if (error) { toast.error(error.message); return }
        setItems(prev => [data, ...prev])
        toast.success('Achievement added ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string) {
    if (!confirm('Delete this achievement?')) return
    await supabase.from('achievements').delete().eq('id', id)
    setItems(prev => prev.filter(a => a.id!==id))
    toast.success('Deleted')
  }

  const levelColors: Record<string,string> = {
    School:'bg-slate-100 text-slate-600', District:'bg-blue-50 text-blue-700',
    Provincial:'bg-purple-50 text-purple-700', National:'bg-amber-50 text-amber-700',
    International:'bg-red-50 text-red-700'
  }
  const catIcons: Record<string,string> = {
    Academic:'📚', Sports:'⚽', Arts:'🎨', Science:'🔬', Debate:'🎤',
    Community:'🤝', Technology:'💻', Other:'🏆'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>🏆 Achievements</h1>
          <p className="text-slate-500 text-sm">{items.length} achievements recorded</p>
        </div>
        <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Add Achievement
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={()=>setFilterCat('')} className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${!filterCat?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>All</button>
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setFilterCat(c===filterCat?'':c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${filterCat===c?'bg-green-900 text-white border-green-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
            {catIcons[c]} {c}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length===0 ? (
          <div className="col-span-3 bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-slate-500 font-semibold">No achievements yet. Add the first one!</p>
          </div>
        ) : filtered.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${a.featured?'border-amber-300':'border-slate-100'}`}>
            {a.photo_url && <img src={a.photo_url} className="w-full h-36 object-cover" alt="" />}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-lg">{catIcons[a.category]||'🏆'}</span>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{a.category}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${levelColors[a.level]}`}>{a.level}</span>
                {a.featured && <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg ml-auto">⭐ Featured</span>}
              </div>
              <h3 className="font-black text-slate-800 leading-snug mb-1">{a.title}</h3>
              <p className="text-green-900 text-sm font-bold">{a.student_name}{a.class && ` · Class ${a.class}`}</p>
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{a.description}</p>
              {a.prize && <p className="text-amber-600 text-xs font-bold mt-1">🏅 {a.prize}</p>}
              <p className="text-slate-400 text-xs mt-1">📅 {a.date}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>openEdit(a)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-xl transition-colors">✏️ Edit</button>
                <button onClick={()=>handleDelete(a.id)} className="px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl transition-colors">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'✏️ Edit Achievement':'🏆 Add Achievement'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoFile ? <img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" alt="" />
                    : editing?.photo_url ? <img src={editing.photo_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-2xl">🏆</span>}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                  📷 Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setPhotoFile(e.target.files?.[0]||null)} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Achievement Title *</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. First Position in District Science Olympiad"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Student Name *</label>
                <input value={form.student_name} onChange={e=>setForm(p=>({...p,student_name:e.target.value}))} placeholder="Full name"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class</label>
                <input value={form.class} onChange={e=>setForm(p=>({...p,class:e.target.value}))} placeholder="e.g. 10, 9A"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Prize / Award</label>
                <input value={form.prize} onChange={e=>setForm(p=>({...p,prize:e.target.value}))} placeholder="Gold Medal, Certificate, Trophy..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the achievement..." rows={3}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Level</label>
                  <select value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {LEVELS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e=>setForm(p=>({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500 rounded" />
                <span className="text-sm font-bold text-slate-600">⭐ Feature on homepage</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}
                {editing?'✅ Update':'🏆 Add Achievement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
