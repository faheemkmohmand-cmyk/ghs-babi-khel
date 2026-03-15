'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


const CATEGORIES = ['Academic','Sports','Events','Achievement','General','Announcement','Science']
type Article = { id:string; title:string; content:string; category:string; image_url?:string; date:string; author:string; featured:boolean; published:boolean; created_at:string }
const emptyForm = { title:'', content:'', category:'General', date:new Date().toISOString().split('T')[0], author:'School Administration', featured:false, published:true }

export default function NewsClient({ initialNews }: { initialNews:Article[] }) {
  const supabase = createClient()

  const [news, setNews] = useState<Article[]>(initialNews)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Article|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imgFile, setImgFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)

  function openAdd() { setEditing(null); setForm(emptyForm); setImgFile(null); setShowModal(true) }
  function openEdit(a:Article) {
    setEditing(a); setImgFile(null)
    setForm({ title:a.title, content:a.content, category:a.category, date:a.date, author:a.author, featured:a.featured, published:a.published })
    setShowModal(true)
  }

  async function uploadImage(id:string): Promise<string|null> {
    if (!imgFile) return null
    const ext = imgFile.name.split('.').pop()
    const path = `news/${id}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, imgFile, { upsert:true })
    if (error) return null
    const { data } = supabase.storage.from('gallery').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setSaving(true)
    try {
      const tmpId = editing?.id || crypto.randomUUID()
      let image_url = editing?.image_url || null
      if (imgFile) { const url = await uploadImage(tmpId); if (url) image_url = url }
      if (editing) {
        const { data, error } = await supabase.from('news').update({...form, image_url}).eq('id', editing.id).select().single() as any
        if (error) { toast.error(error.message); return }
        setNews(prev => prev.map(a => a.id===editing.id ? data : a))
        toast.success('Article updated ✅')
      } else {
        const { data, error } = await supabase.from('news').insert({...form, image_url}).select().single() as any
        if (error) { toast.error(error.message); return }
        setNews(prev => [data, ...prev])
        toast.success('Article published ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string) {
    if (!confirm('Delete this article?')) return
    await supabase.from('news').delete().eq('id', id)
    setNews(prev => prev.filter(a=>a.id!==id))
    toast.success('Article deleted')
  }

  async function togglePublish(a:Article) {
    const { data } = await supabase.from('news').update({published:!a.published}).eq('id',a.id).select().single() as any
    if (data) { setNews(prev=>prev.map(x=>x.id===a.id?data:x)); toast.success(data.published?'Published':'Hidden') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📰 News & Articles</h1>
          <p className="text-slate-500 text-sm">{news.length} articles · {news.filter(a=>a.published).length} published</p>
        </div>
        <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Write Article
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {news.length===0 ? (
          <div className="col-span-3 bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📰</div>
            <p className="text-slate-500 font-semibold">No articles yet. Write your first one!</p>
          </div>
        ) : news.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${!a.published?'opacity-60 border-dashed border-slate-200':'border-slate-100'}`}>
            {a.image_url && <img src={a.image_url} className="w-full h-40 object-cover" alt="" />}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{a.category}</span>
                {a.featured && <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">⭐ Featured</span>}
                {!a.published && <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">Hidden</span>}
              </div>
              <h3 className="font-black text-slate-800 leading-snug mb-1">{a.title}</h3>
              <p className="text-slate-500 text-xs line-clamp-2 mb-3">{a.content}</p>
              <div className="text-xs text-slate-400 mb-3">{a.date} · {a.author}</div>
              <div className="flex gap-2">
                <button onClick={()=>openEdit(a)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-xl transition-colors">✏️ Edit</button>
                <button onClick={()=>togglePublish(a)} className={`flex-1 font-bold text-xs py-2 rounded-xl transition-colors ${a.published?'bg-amber-50 hover:bg-amber-100 text-amber-700':'bg-green-50 hover:bg-green-100 text-green-700'}`}>{a.published?'👁️ Hide':'✅ Publish'}</button>
                <button onClick={()=>handleDelete(a.id)} className="px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl transition-colors">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'✏️ Edit Article':'📰 Write Article'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Headline *</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Article headline..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Content *</label>
                <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} placeholder="Write the full article here..." rows={6}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Author</label>
                  <input value={form.author} onChange={e=>setForm(p=>({...p,author:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Cover Image</label>
                <div className="flex items-center gap-4">
                  {(imgFile || editing?.image_url) && (
                    <img src={imgFile?URL.createObjectURL(imgFile):editing?.image_url} className="w-24 h-16 object-cover rounded-xl flex-shrink-0" alt="" />
                  )}
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                    📷 Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={e=>setImgFile(e.target.files?.[0]||null)} />
                  </label>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e=>setForm(p=>({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500 rounded" />
                  <span className="text-sm font-bold text-slate-600">⭐ Featured Article</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e=>setForm(p=>({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600 rounded" />
                  <span className="text-sm font-bold text-slate-600">✅ Published</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
                {editing ? '✅ Update' : '📰 Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
