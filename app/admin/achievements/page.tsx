'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Achievement = { id:string; title:string; description:string; category:string; year:string; recipient:string; awarded_by:string; icon:string; image_url:string; featured:boolean }
const emptyForm = { title:'', description:'', category:'academic', year:new Date().getFullYear().toString(), recipient:'', awarded_by:'School Administration', icon:'🏆', featured:false }
const CATEGORIES = ['academic','sports','science','extracurricular','environment']
const catIcons: Record<string,string> = { academic:'📚', sports:'⚽', science:'🔬', extracurricular:'🎨', environment:'🌿' }

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Achievement|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imgFile, setImgFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<{full_name:string}|null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id',user.id).single()
      if (!p||p.role!=='admin') { window.location.href='/dashboard'; return }
      setProfile(p)
      const { data } = await supabase.from('achievements').select('*').order('year',{ascending:false})
      setItems(data||[])
      setLoading(false)
    }
    init()
  }, [])

  function openAdd() { setEditing(null); setForm(emptyForm); setImgFile(null); setShowModal(true) }
  function openEdit(a:Achievement) {
    setEditing(a); setImgFile(null)
    setForm({ title:a.title, description:a.description, category:a.category, year:a.year, recipient:a.recipient, awarded_by:a.awarded_by||'School Administration', icon:a.icon||'🏆', featured:a.featured })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title||!form.recipient) { toast.error('Title and recipient required'); return }
    setSaving(true)
    try {
      let image_url = editing?.image_url||''
      if (imgFile) {
        const ext = imgFile.name.split('.').pop()
        const path = `achievements/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('gallery').upload(path,imgFile,{upsert:true})
        if (!upErr) image_url = supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
      }
      const payload = { ...form, image_url }
      if (editing) {
        const { data, error } = await supabase.from('achievements').update(payload).eq('id',editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setItems(prev=>prev.map(a=>a.id===editing.id?data:a))
        toast.success('Achievement updated ✅')
      } else {
        const { data, error } = await supabase.from('achievements').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setItems(prev=>[data,...prev])
        toast.success('Achievement added ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string) {
    if (!confirm('Delete this achievement?')) return
    await supabase.from('achievements').delete().eq('id',id)
    setItems(prev=>prev.filter(a=>a.id!==id))
    toast.success('Deleted')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full spinner mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-slate-800 text-sm">Achievements</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">🏆 Achievements</h1>
            <p className="text-slate-500 text-sm mt-0.5">{items.length} achievements recorded</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">➕ Add Achievement</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length===0 ? (
            <div className="col-span-3 bg-white rounded-3xl border border-slate-100 p-16 text-center"><div className="text-5xl mb-3">🏆</div><p className="text-slate-500 font-semibold">No achievements yet!</p></div>
          ) : items.map(a=>(
            <div key={a.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${a.featured?'border-amber-300':'border-slate-100'}`}>
              {a.image_url&&<img src={a.image_url} className="w-full h-36 object-cover" alt=""/>}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{a.icon||catIcons[a.category]||'🏆'}</span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg capitalize">{a.category}</span>
                  {a.featured&&<span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg ml-auto">⭐</span>}
                </div>
                <h3 className="font-black text-slate-800 leading-snug mb-1">{a.title}</h3>
                <p className="text-green-900 text-sm font-bold">{a.recipient}</p>
                <p className="text-slate-400 text-xs mt-0.5">{a.year} · {a.awarded_by}</p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-2">{a.description}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>openEdit(a)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-xl transition-colors">✏️ Edit</button>
                  <button onClick={()=>handleDelete(a.id)} className="px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="font-display text-xl font-black text-slate-800">{editing?'✏️ Edit Achievement':'🏆 Add Achievement'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {imgFile?<img src={URL.createObjectURL(imgFile)} className="w-full h-full object-cover" alt=""/>:editing?.image_url?<img src={editing.image_url} className="w-full h-full object-cover" alt=""/>:<span className="text-2xl">{form.icon||'🏆'}</span>}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                  📷 Upload Photo<input type="file" accept="image/*" className="hidden" onChange={e=>setImgFile(e.target.files?.[0]||null)}/>
                </label>
              </div>
              {[{k:'title',l:'Title *',ph:'Achievement title'},{k:'recipient',l:'Recipient *',ph:'Student/Team name'},{k:'awarded_by',l:'Awarded By',ph:'Organization name'},{k:'year',l:'Year',ph:'2025'},{k:'icon',l:'Icon Emoji',ph:'🏆'},{k:'description',l:'Description',ph:'Details about this achievement...',ta:true}].map(f=>(
                <div key={f.k}>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.l}</label>
                  {f.ta
                    ?<textarea value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} rows={3} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
                    :<input value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c=><button key={c} type="button" onClick={()=>setForm(p=>({...p,category:c}))} className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all capitalize ${form.category===c?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{catIcons[c]} {c}</button>)}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e=>setForm(p=>({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500 rounded"/>
                <span className="text-sm font-bold text-slate-600">⭐ Feature on homepage</span>
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                {editing?'✅ Update':'🏆 Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
