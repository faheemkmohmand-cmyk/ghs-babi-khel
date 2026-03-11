'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Notice = { id: string; title: string; content: string; type: string; date: string; important: boolean; published: boolean; audience: string }

export default function AdminNoticesPage() {
  const supabase = createClient()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', content:'', type:'general', date: new Date().toISOString().split('T')[0], important: false, published: true, audience:'all' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('notices').select('*').order('date', { ascending: false })
    setNotices(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null)
    setForm({ title:'', content:'', type:'general', date: new Date().toISOString().split('T')[0], important: false, published: true, audience:'all' })
    setShowForm(true)
  }

  function openEdit(n: Notice) {
    setEditing(n)
    setForm({ title: n.title, content: n.content, type: n.type, date: n.date, important: n.important, published: n.published, audience: n.audience })
    setShowForm(true)
  }

  async function save() {
    if (!form.title || !form.content) { toast.error('Title and content required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('notices').update(form).eq('id', editing.id)
        if (error) throw error
        toast.success('Notice updated!')
      } else {
        const { error } = await supabase.from('notices').insert(form)
        if (error) throw error
        toast.success('Notice posted!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const typeColor: Record<string, string> = { exam:'bg-red-100 text-red-700', holiday:'bg-sky-100 text-sky-700', event:'bg-green-100 text-green-700', general:'bg-amber-100 text-amber-700' }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📢 Notices</h1>
            <p className="text-slate-500 text-sm">{notices.length} total notices</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">+ Post Notice</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
          : notices.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📢</div>
              <p className="text-slate-400 font-semibold">No notices yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Post First Notice</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notices.map(n => (
                <div key={n.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${typeColor[n.type]||'bg-slate-100 text-slate-600'}`}>{n.type.toUpperCase()}</span>
                      {n.important && <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100">🔴 Important</span>}
                      {!n.published && <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">Draft</span>}
                    </div>
                    <p className="font-bold text-slate-800">{n.title}</p>
                    <p className="text-slate-500 text-sm mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-slate-400 text-xs mt-1">{n.date} · {n.audience}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(n)} className="text-xs font-bold text-sky-600 hover:text-sky-800 px-2.5 py-1.5 rounded-lg hover:bg-sky-50 transition-all">Edit</button>
                    <button onClick={() => del(n.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-all">Del</button>
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
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Notice' : 'Post New Notice'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Notice title"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Content *</label>
                <textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} placeholder="Notice details..." rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {['general','exam','holiday','event'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Audience</label>
                <select value={form.audience} onChange={e => setForm(p => ({...p, audience: e.target.value}))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                  {['all','students','parents','teachers'].map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase()+a.slice(1)}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.important} onChange={e => setForm(p => ({...p, important: e.target.checked}))} className="w-4 h-4 accent-red-500" />
                  <span className="text-sm font-bold text-slate-700">Mark Important</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({...p, published: e.target.checked}))} className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-bold text-slate-700">Published</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : (editing ? 'Update' : 'Post Notice')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
