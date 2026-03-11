'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Album = { id: string; title: string; description: string; date: string; category: string; published: boolean }

export default function AdminGalleryPage() {
  const supabase = createClient()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Album | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', description:'', date:new Date().toISOString().split('T')[0], category:'general', published:true })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('gallery_albums').select('*').order('date', { ascending:false })
    setAlbums(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm({ title:'', description:'', date:new Date().toISOString().split('T')[0], category:'general', published:true }); setShowForm(true) }
  function openEdit(a: Album) { setEditing(a); setForm({ title:a.title, description:a.description||'', date:a.date, category:a.category, published:a.published }); setShowForm(true) }

  async function save() {
    if (!form.title) { toast.error('Title required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('gallery_albums').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Album updated!')
      } else {
        const { error } = await supabase.from('gallery_albums').insert(form)
        if (error) throw error; toast.success('Album created!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this album?')) return
    await supabase.from('gallery_albums').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const CATEGORIES = ['general','events','sports','academics','ceremonies','trips']

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-black text-slate-800">🖼️ Gallery</h1><p className="text-slate-500 text-sm">{albums.length} albums</p></div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Create Album</button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>📌 How to add photos:</strong> Create an album here, then upload photos directly to your <strong>Supabase Storage → gallery bucket</strong> and add the photo URLs to the gallery_photos table.
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <div className="col-span-3 text-center py-16 text-slate-400">Loading...</div>
          : albums.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl border border-slate-100 text-center py-16">
              <div className="text-5xl mb-3">🖼️</div><p className="text-slate-400 font-semibold">No albums yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Create First Album</button>
            </div>
          ) : albums.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-4xl mb-3">🖼️</div>
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-black text-slate-800 leading-snug">{a.title}</h3>
                {!a.published && <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg ml-2 flex-shrink-0">Draft</span>}
              </div>
              {a.description && <p className="text-slate-500 text-sm mb-2 line-clamp-2">{a.description}</p>}
              <p className="text-slate-400 text-xs">{a.date} · {a.category}</p>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Album' : 'Create Album'}</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))} placeholder="Album title"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({...p,date:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600"/>
                <span className="text-sm font-bold text-slate-700">Published (visible on website)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update':'Create')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
