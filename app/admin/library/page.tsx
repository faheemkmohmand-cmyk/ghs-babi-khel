'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Book = { id: string; title: string; author: string; subject: string; class: string; type: string; total_copies: number; available_copies: number; isbn: string; description: string }

export default function AdminLibraryPage() {
  const supabase = createClient()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title:'', author:'', subject:'', class:'All', type:'textbook', total_copies:1, available_copies:1, isbn:'', description:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('books').select('*').order('title')
    setBooks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase()) ||
    b.subject?.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() { setEditing(null); setForm({ title:'', author:'', subject:'', class:'All', type:'textbook', total_copies:1, available_copies:1, isbn:'', description:'' }); setShowForm(true) }
  function openEdit(b: Book) { setEditing(b); setForm({ title:b.title, author:b.author, subject:b.subject, class:b.class, type:b.type, total_copies:b.total_copies, available_copies:b.available_copies, isbn:b.isbn||'', description:b.description||'' }); setShowForm(true) }

  async function save() {
    if (!form.title || !form.author) { toast.error('Title and author required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('books').update(form).eq('id', editing.id)
        if (error) throw error; toast.success('Book updated!')
      } else {
        const { error } = await supabase.from('books').insert(form)
        if (error) throw error; toast.success('Book added!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this book?')) return
    await supabase.from('books').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const typeColor: Record<string,string> = { textbook:'bg-green-50 text-green-700', reference:'bg-sky-50 text-sky-700', guide:'bg-purple-50 text-purple-700' }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="font-display text-2xl font-black text-slate-800">📚 Library</h1><p className="text-slate-500 text-sm">{books.length} books in library</p></div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Add Book</button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, author, subject..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400" />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
          : filtered.length === 0 ? (
            <div className="text-center py-16"><div className="text-5xl mb-3">📚</div><p className="text-slate-400 font-semibold">No books found</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Add First Book</button></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Title','Author','Subject','Class','Type','Total','Available','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-800">{b.title}</td>
                      <td className="px-4 py-3 text-slate-600">{b.author}</td>
                      <td className="px-4 py-3 text-slate-500">{b.subject}</td>
                      <td className="px-4 py-3 text-slate-500">{b.class}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-lg ${typeColor[b.type]||'bg-slate-100 text-slate-600'}`}>{b.type}</span></td>
                      <td className="px-4 py-3 text-slate-600 text-center">{b.total_copies}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-xs font-bold px-2 py-1 rounded-full ${b.available_copies > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{b.available_copies}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(b)} className="text-xs font-bold text-sky-600 px-2 py-1 rounded-lg hover:bg-sky-50">Edit</button>
                          <button onClick={() => del(b.id)} className="text-xs font-bold text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Book' : 'Add Book'}</h2>
            <div className="space-y-3">
              {[{label:'Title *',key:'title',ph:'Book title'},{label:'Author *',key:'author',ph:'Author name'},{label:'Subject',key:'subject',ph:'e.g. Mathematics'},{label:'ISBN',key:'isbn',ph:'ISBN number'}].map(f => (
                <div key={f.key}><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={form.class} onChange={e => setForm(p => ({...p,class:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['All','6','7','8','9','10'].map(c => <option key={c} value={c}>{c==='All'?'All':` Class ${c}`}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p,type:e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['textbook','reference','guide'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Copies</label>
                  <input type="number" min="1" value={form.total_copies} onChange={e => { const v=parseInt(e.target.value)||1; setForm(p => ({...p,total_copies:v,available_copies:Math.min(p.available_copies,v)})) }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{saving?'Saving...':(editing?'Update':'Add Book')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
