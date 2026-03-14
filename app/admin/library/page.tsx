'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Resource = { id: string; title: string; description: string; category: string; class: string; subject: string; file_url: string; file_type: string; file_size: string; published: boolean; created_at: string }

const CATEGORIES = ['Textbook','Notes','Past Papers','Guide Book','Reference','Worksheet','Syllabus','Other']
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer','General Science','Social Studies','All Subjects']

export default function AdminLibraryPage() {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title:'', description:'', category:'Notes', class:'All', subject:'All Subjects', file_url:'', file_type:'pdf', file_size:'', published:true })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('library_resources').select('*').order('created_at',{ascending:false})
    setResources(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ title:'', description:'', category:'Notes', class:'All', subject:'All Subjects', file_url:'', file_type:'pdf', file_size:'', published:true })
    setShowForm(true)
  }

  function openEdit(r: Resource) {
    setEditing(r)
    setForm({ title:r.title, description:r.description||'', category:r.category, class:r.class||'All', subject:r.subject||'All Subjects', file_url:r.file_url||'', file_type:r.file_type||'pdf', file_size:r.file_size||'', published:r.published })
    setShowForm(true)
  }

  async function uploadFile(file: File) {
    if (file.size > 50 * 1024 * 1024) { toast.error('File too large. Max 50MB'); return }
    setUploading(true)
    setUploadPct(10)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `library/${Date.now()}_${safeName}`
    const sizeMB = (file.size / (1024*1024)).toFixed(2)

    setUploadPct(30)

    // Try gallery bucket (already exists and is public)
    const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true })

    setUploadPct(80)

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setUploading(false)
      setUploadPct(0)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)
    setForm(p => ({ ...p, file_url: publicUrl, file_type: ext, file_size: `${sizeMB} MB` }))
    if (!form.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/_/g,' ').replace(/-/g,' ')
      setForm(p => ({ ...p, title: nameWithoutExt, file_url: publicUrl, file_type: ext, file_size: `${sizeMB} MB` }))
    }
    setUploadPct(100)
    setUploading(false)
    toast.success('File uploaded successfully!')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function save() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.file_url.trim()) { toast.error('Please upload a file first'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('library_resources').update(form).eq('id', editing.id)
        if (error) throw error
        toast.success('Updated!')
      } else {
        const { error } = await supabase.from('library_resources').insert(form)
        if (error) throw error
        toast.success('Resource added!')
      }
      setShowForm(false)
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('library_resources').delete().eq('id', id)
    toast.success('Deleted')
    load()
  }

  async function togglePublish(r: Resource) {
    const { data } = await supabase.from('library_resources').update({ published: !r.published }).eq('id', r.id).select().single()
    if (data) setResources(prev => prev.map(x => x.id === r.id ? data : x))
    toast.success(r.published ? 'Hidden' : 'Published!')
  }

  const fileIcon = (type: string) => ({ pdf:'📄', docx:'📝', doc:'📝', pptx:'📊', ppt:'📊', xlsx:'📈', jpg:'🖼️', png:'🖼️', mp4:'🎬' }[type] || '📁')
  const fileColor = (type: string) => ({ pdf:'bg-red-50 border-red-200 text-red-700', docx:'bg-blue-50 border-blue-200 text-blue-700', doc:'bg-blue-50 border-blue-200 text-blue-700', pptx:'bg-orange-50 border-orange-200 text-orange-700' }[type] || 'bg-slate-50 border-slate-200 text-slate-600')

  const filtered = resources.filter(r => {
    const s = search.toLowerCase()
    return (r.title?.toLowerCase().includes(s) || r.subject?.toLowerCase().includes(s)) &&
           (filterCat === 'All' || r.category === filterCat)
  })

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📚 Library Resources</h1>
            <p className="text-slate-500 text-sm">{resources.length} resources — Upload PDFs, notes, books, past papers</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md">
            + Add Resource
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['All',...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCat===c?'bg-slate-900 text-white':'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{c}</button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or subject..."
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"/>

        {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
        : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-slate-400 font-semibold">No resources yet</p>
            <button onClick={openAdd} className="mt-3 bg-green-900 text-white font-bold px-4 py-2 rounded-xl text-sm">Add First Resource</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${fileColor(r.file_type)}`}>
                  <span className="text-2xl">{fileIcon(r.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black uppercase">{r.file_type}</span>
                    {r.file_size && <span className="text-xs opacity-60 ml-2">{r.file_size}</span>}
                  </div>
                  {!r.published && <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-lg">Hidden</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-slate-800 text-sm leading-snug mb-1">{r.title}</h3>
                  {r.description && <p className="text-slate-400 text-xs line-clamp-2 mb-2">{r.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">{r.category}</span>
                    {r.class !== 'All' && <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-lg">Class {r.class}</span>}
                    {r.subject && r.subject !== 'All Subjects' && <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-lg">{r.subject}</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <a href={r.file_url} target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-xs font-bold bg-slate-900 text-white px-2 py-1.5 rounded-lg hover:bg-slate-700">View</a>
                    <button onClick={() => openEdit(r)} className="text-xs font-bold text-sky-600 border border-sky-200 px-2.5 py-1.5 rounded-lg hover:bg-sky-50">Edit</button>
                    <button onClick={() => togglePublish(r)} className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border ${r.published?'text-green-700 border-green-200 bg-green-50':'text-slate-500 border-slate-200'}`}>
                      {r.published?'Live':'Show'}
                    </button>
                    <button onClick={() => del(r.id)} className="text-xs font-bold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-black text-slate-800">{editing ? 'Edit Resource' : 'Add Resource'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500">x</button>
            </div>

            <div className="space-y-4">
              {/* FILE UPLOAD - Main feature */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Upload File From Your Device</label>
                <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${form.file_url ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}>
                  {form.file_url ? (
                    <div>
                      <div className="text-3xl mb-1">{fileIcon(form.file_type)}</div>
                      <p className="font-bold text-green-700 text-sm">File uploaded!</p>
                      <p className="text-green-600 text-xs mt-0.5">{form.file_size} · {form.file_type.toUpperCase()}</p>
                      <button onClick={() => { setForm(p => ({...p, file_url:'', file_size:''})); if(fileRef.current) fileRef.current.value='' }}
                        className="mt-2 text-xs text-red-500 font-bold hover:underline">Remove file</button>
                    </div>
                  ) : uploading ? (
                    <div>
                      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-2"/>
                      <p className="text-sm font-bold text-slate-600">Uploading... {uploadPct}%</p>
                      <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden max-w-48 mx-auto">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{width:`${uploadPct}%`}}/>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📤</div>
                      <p className="text-slate-600 font-bold text-sm mb-1">Browse from your laptop or phone</p>
                      <p className="text-slate-400 text-xs mb-3">PDF, Word, PowerPoint, Excel, Images — Max 50MB</p>
                      <label className="cursor-pointer bg-green-900 hover:bg-green-950 text-white font-bold px-6 py-2.5 rounded-xl text-sm inline-block transition-all">
                        Browse & Upload File
                        <input ref={fileRef} type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp4"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}/>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p,title:e.target.value}))}
                  placeholder="e.g. Mathematics Notes Chapter 1"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))}
                  rows={2} placeholder="Brief description..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={form.class} onChange={e => setForm(p => ({...p,class:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-400">
                    {['All','6','7','8','9','10'].map(c => <option key={c} value={c}>{c==='All'?'All':'Class '+c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                  <select value={form.subject} onChange={e => setForm(p => ({...p,subject:e.target.value}))}
                    className="w-full border-2 border-slate-200 rounded-xl px-2 py-2.5 text-sm outline-none focus:border-green-400">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600"/>
                <span className="text-sm font-bold text-slate-700">Publish immediately (visible to all students)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl">Cancel</button>
              <button onClick={save} disabled={saving || uploading}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
