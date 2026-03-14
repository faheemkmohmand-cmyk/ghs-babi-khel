'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Article = { id: string; title: string; content: string; category: string; date: string; author: string; featured: boolean; published: boolean; cover_image: string }

const CATEGORIES = ['General','Academic','Sports','Events','Achievements','Health','Cultural']

export default function AdminNewsPage() {
  const supabase = createClient()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all'|'published'|'draft'>('all')
  const [form, setForm] = useState({
    title:'', content:'', category:'General',
    date:new Date().toISOString().split('T')[0],
    author:'School Administration', featured:false, published:true, cover_image:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('news').select('*').order('date', { ascending:false })
    setArticles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ title:'', content:'', category:'General', date:new Date().toISOString().split('T')[0], author:'School Administration', featured:false, published:true, cover_image:'' })
    setShowForm(true)
  }
  function openEdit(a: Article) {
    setEditing(a)
    setForm({ title:a.title, content:a.content, category:a.category, date:a.date, author:a.author, featured:a.featured, published:a.published, cover_image:a.cover_image||'' })
    setShowForm(true)
  }

  async function save() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('news').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Article updated!')
      } else {
        const { error } = await supabase.from('news').insert(form)
        if (error) throw error; toast.success('Article published!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this article?')) return
    await supabase.from('news').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  async function togglePublish(a: Article) {
    await supabase.from('news').update({ published: !a.published }).eq('id', a.id)
    toast.success(a.published ? 'Unpublished' : 'Published!')
    load()
  }

  async function toggleFeatured(a: Article) {
    if (!a.featured) await supabase.from('news').update({ featured: false }).neq('id', a.id)
    await supabase.from('news').update({ featured: !a.featured }).eq('id', a.id)
    toast.success(a.featured ? 'Unfeatured' : '⭐ Featured!')
    load()
  }

  const filtered = articles.filter(a =>
    filterStatus === 'all' ? true : filterStatus === 'published' ? a.published : !a.published
  )

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📰 News & Articles</h1>
            <p className="text-slate-500 text-sm">{articles.filter(a=>a.published).length} published · {articles.filter(a=>!a.published).length} drafts</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">✍️ Write Article</button>
        </div>

        <div className="flex gap-2">
          {(['all','published','draft'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterStatus===f?'bg-slate-900 text-white':'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{f}</button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">Loading...</div>
          : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
              <div className="text-5xl mb-3">📰</div>
              <p className="text-slate-400 font-semibold">No articles yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Write First Article</button>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">{a.category}</span>
                    {a.featured && <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200">⭐ Featured</span>}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${a.published?'bg-green-50 text-green-700':'bg-slate-100 text-slate-500'}`}>{a.published?'✅ Published':'📝 Draft'}</span>
                    <span className="text-slate-400 text-xs ml-auto">{a.date}</span>
                  </div>
                  <h3 className="font-display font-black text-slate-800 text-lg leading-snug mb-1">{a.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{a.content}</p>
                  <p className="text-slate-400 text-xs mt-2">By {a.author}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <button onClick={() => openEdit(a)} className="text-xs font-bold text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg hover:bg-sky-50">✏️ Edit</button>
                <button onClick={() => togglePublish(a)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${a.published?'text-slate-500 border-slate-200 hover:bg-slate-50':'text-green-700 border-green-200 hover:bg-green-50'}`}>
                  {a.published?'Unpublish':'Publish'}
                </button>
                <button onClick={() => toggleFeatured(a)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${a.featured?'text-amber-600 border-amber-200 bg-amber-50':'text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}>
                  {a.featured?'⭐ Featured':'☆ Feature'}
                </button>
                <button onClick={() => del(a.id)} className="text-xs font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 ml-auto">🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Article' : '✍️ Write Article'}</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Headline *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="News headline..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 font-semibold"/></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Article Content *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({...p,content:e.target.value}))} rows={6} placeholder="Write the full article..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none leading-relaxed"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Publish Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({...p,date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Author</label>
                <input value={form.author} onChange={e => setForm(p => ({...p,author:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Cover Image URL (optional)</label>
                <input value={form.cover_image} onChange={e => setForm(p => ({...p,cover_image:e.target.value}))} placeholder="https://..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600"/>
                  <span className="text-sm font-bold text-slate-700">Publish immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500"/>
                  <span className="text-sm font-bold text-slate-700">⭐ Feature this article</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update Article':'Publish')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
