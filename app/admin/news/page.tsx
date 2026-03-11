'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type News = { id: string; title: string; content: string; category: string; date: string; author: string; featured: boolean; published: boolean }

export default function AdminNewsPage() {
  const supabase = createClient()
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<News | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', content:'', category:'General', date:new Date().toISOString().split('T')[0], author:'School Administration', featured:false, published:true })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('news').select('*').order('date', { ascending:false })
    setNews(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm({ title:'', content:'', category:'General', date:new Date().toISOString().split('T')[0], author:'School Administration', featured:false, published:true }); setShowForm(true) }
  function openEdit(n: News) { setEditing(n); setForm({ title:n.title, content:n.content, category:n.category, date:n.date, author:n.author, featured:n.featured, published:n.published }); setShowForm(true) }

  async function save() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('news').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('News updated!')
      } else {
        const { error } = await supabase.from('news').insert(form)
        if (error) throw error; toast.success('News published!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete?')) return
    await supabase.from('news').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-black text-slate-800">📰 News</h1><p className="text-slate-500 text-sm">{news.length} articles</p></div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Write News</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
          : news.length === 0 ? (
            <div className="text-center py-16"><div className="text-5xl mb-3">📰</div><p className="text-slate-400 font-semibold">No news yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Write First Article</button></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {news.map(n => (
                <div key={n.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">{n.category}</span>
                      {n.featured && <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg border border-amber-200">⭐ Featured</span>}
                      {!n.published && <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-lg">Draft</span>}
                    </div>
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-slate-400 text-xs mt-1">{n.date} · {n.author}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(n)} className="text-xs font-bold text-sky-600 hover:text-sky-800 px-2.5 py-1.5 rounded-lg hover:bg-sky-50">Edit</button>
                    <button onClick={() => del(n.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Article' : 'Write News Article'}</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="News headline"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({...p,content:e.target.value}))} rows={5} placeholder="Full article content..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} placeholder="e.g. Sports"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({...p,date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Author</label>
                <input value={form.author} onChange={e => setForm(p => ({...p,author:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({...p,featured:e.target.checked}))} className="w-4 h-4 accent-amber-500"/>
                  <span className="text-sm font-bold text-slate-700">Featured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600"/>
                  <span className="text-sm font-bold text-slate-700">Published</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update':'Publish')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
