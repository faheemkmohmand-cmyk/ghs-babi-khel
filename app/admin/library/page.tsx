'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Resource = { id: string; title: string; description: string; category: string; class: string; subject: string; file_url: string; file_type: string; file_size: string; uploaded_by: string; published: boolean; download_count: number; created_at: string }

const CATEGORIES = ['Textbook','Notes','Past Papers','Guide Book','Reference','Worksheet','Syllabus','Other']
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer','General Science','Social Studies','All Subjects']
const FILE_ICONS: Record<string, string> = { pdf:'📄', docx:'📝', doc:'📝', pptx:'📊', xlsx:'📊', jpg:'🖼️', png:'🖼️', mp4:'🎬', other:'📁' }

function fileIcon(type: string) { return FILE_ICONS[type] || '📁' }
function fileColor(type: string) {
  if (type === 'pdf') return 'bg-red-50 text-red-700 border-red-200'
  if (['docx','doc'].includes(type)) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (['pptx','ppt'].includes(type)) return 'bg-orange-50 text-orange-700 border-orange-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function AdminLibraryPage() {
  const supabase = createClient()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Notes', class: 'All',
    subject: 'All Subjects', file_url: '', file_type: 'pdf',
    file_size: '', uploaded_by: 'Admin', published: true
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('library_resources').select('*').order('created_at', { ascending: false })
    setResources(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ title:'', description:'', category:'Notes', class:'All', subject:'All Subjects', file_url:'', file_type:'pdf', file_size:'', uploaded_by:'Admin', published:true })
    setShowForm(true)
  }

  function openEdit(r: Resource) {
    setEditing(r)
    setForm({ title:r.title, description:r.description||'', category:r.category, class:r.class||'All', subject:r.subject||'All Subjects', file_url:r.file_url||'', file_type:r.file_type||'pdf', file_size:r.file_size||'', uploaded_by:r.uploaded_by||'Admin', published:r.published })
    setShowForm(true)
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadProgress(10)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const path = `library/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    setUploadProgress(40)
    const { error } = await supabase.storage.from('library-files').upload(path, file, { upsert: false })
    setUploadProgress(80)
    if (error) {
      // Try gallery bucket as fallback
      const { error: e2 } = await supabase.storage.from('gallery').upload(`library/${path}`, file, { upsert: false })
      if (e2) { toast.error('Upload failed: ' + e2.message); setUploading(false); setUploadProgress(0); return }
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(`library/${path}`)
      setForm(p => ({ ...p, file_url: publicUrl, file_type: ext, file_size: `${sizeMB} MB` }))
    } else {
      const { data: { publicUrl } } = supabase.storage.from('library-files').getPublicUrl(path)
      setForm(p => ({ ...p, file_url: publicUrl, file_type: ext, file_size: `${sizeMB} MB` }))
    }
    setUploadProgress(100)
    setUploading(false)
    toast.success('File uploaded!')
    if (!form.title) setForm(p => ({ ...p, title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g,' ') }))
  }

  async function save() {
    if (!form.title) { toast.error('Title required'); return }
    if (!form.file_url) { toast.error('Upload a file first'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('library_resources').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Updated!')
      } else {
        const { error } = await supabase.from('library_resources').insert(form)
        if (error) throw error; toast.success('Resource added!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this resource?')) return
    await supabase.from('library_resources').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  async function togglePublish(r: Resource) {
    const { data } = await supabase.from('library_resources').update({ published: !r.published }).eq('id', r.id).select().single()
    if (data) { setResources(prev => prev.map(x => x.id === r.id ? data : x)); toast.success(data.published ? 'Published!' : 'Hidden') }
  }

  const filtered = resources.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) || r.subject?.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || r.category === filterCat
    return matchSearch && matchCat
  })

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📚 Library Resources</h1>
            <p className="text-slate-500 text-sm">{resources.length} resources — PDFs, notes, past papers, books</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md">
            ➕ Add Resource
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCat === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{c}</button>
          ))}
        </div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or subject..."
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"/>

        {/* Resource grid */}
        {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
        : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-slate-400 font-semibold">No resources found</p>
            <button onClick={openAdd} className="mt-3 bg-green-900 text-white font-bold px-4 py-2 rounded-xl text-sm">Add First Resource</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className={`px-4 py-3 flex items-center gap-3 border-b border-slate-50 ${fileColor(r.file_type)}`}>
                  <span className="text-2xl">{fileIcon(r.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-black uppercase">{r.file_type.toUpperCase()}</span>
                    {r.file_size && <span className="text-xs opacity-70 ml-2">{r.file_size}</span>}
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
                      className="flex-1 text-center text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded-lg hover:bg-green-100">
                      👁 View
                    </a>
                    <button onClick={() => openEdit(r)} className="text-xs font-bold text-sky-600 border border-sky-200 px-2.5 py-1.5 rounded-lg hover:bg-sky-50">✏️</button>
                    <button onClick={() => togglePublish(r)} className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${r.published ? 'text-green-700 border-green-200 bg-green-50' : 'text-slate-500 border-slate-200'}`}>
                      {r.published ? '✅' : '👁'}
                    </button>
                    <button onClick={() => del(r.id)} className="text-xs font-bold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Resource' : '➕ Add Resource'}</h2>
            <div className="space-y-4">
              {/* File Upload */}
              <div className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${form.file_url ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-green-300'}`}>
                {form.file_url ? (
                  <>
                    <div className="text-3xl mb-1">{fileIcon(form.file_type)}</div>
                    <p className="font-bold text-green-700 text-sm">File uploaded! ✅</p>
                    <p className="text-green-600 text-xs">{form.file_size} · {form.file_type.toUpperCase()}</p>
                    <button onClick={() => setForm(p => ({ ...p, file_url: '' }))} className="mt-2 text-xs text-red-500 font-bold hover:underline">Remove</button>
                  </>
                ) : uploading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-2"/>
                    <p className="text-sm font-bold text-slate-600">Uploading {uploadProgress}%...</p>
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden w-full max-w-[200px] mx-auto">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}/>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-slate-500 font-bold text-sm mb-2">Upload PDF, Word, PowerPoint, Notes</p>
                    <label className="cursor-pointer bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm inline-block hover:bg-green-950">
                      Choose File
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png" className="hidden"
                        onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])}/>
                    </label>
                    <p className="text-slate-400 text-xs mt-2">Max 50MB</p>
                  </>
                )}
              </div>

              {/* OR paste URL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Or Paste File URL</label>
                <input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                  placeholder="https://drive.google.com/... or any direct link"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Mathematics Notes Chapter 1-5"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  placeholder="Brief description of this resource..."
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['All','6','7','8','9','10'].map(c => <option key={c} value={c}>{c === 'All' ? 'All' : `Class ${c}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">File Type</label>
                  <select value={form.file_type} onChange={e => setForm(p => ({ ...p, file_type: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['pdf','docx','pptx','xlsx','jpg','png','other'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="w-4 h-4 accent-green-600"/>
                <span className="text-sm font-bold text-slate-700">Publish immediately (visible to students)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl">
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
