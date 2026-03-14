'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Notice = { id:string; title:string; content:string; type:string; date:string; posted_by:string; important:boolean; audience:string; published:boolean }
const emptyForm = { title:'', content:'', type:'general', date:new Date().toISOString().split('T')[0], posted_by:'School Administration', important:false, audience:'all', published:true }
const typeColors: Record<string,string> = { exam:'bg-red-500', holiday:'bg-sky-500', event:'bg-green-600', general:'bg-amber-500' }

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Notice|null>(null)
  const [form, setForm] = useState(emptyForm)
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
      const { data } = await supabase.from('notices').select('*').order('date',{ascending:false})
      setNotices(data||[])
      setLoading(false)
    }
    init()
  }, [])

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true) }
  function openEdit(n:Notice) {
    setEditing(n)
    setForm({ title:n.title, content:n.content, type:n.type, date:n.date, posted_by:n.posted_by||'School Administration', important:n.important, audience:n.audience||'all', published:n.published })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title||!form.content) { toast.error('Title and content required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { data, error } = await supabase.from('notices').update(form).eq('id',editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setNotices(prev=>prev.map(n=>n.id===editing.id?data:n))
        toast.success('Notice updated ✅')
      } else {
        const { data, error } = await supabase.from('notices').insert(form).select().single()
        if (error) { toast.error(error.message); return }
        setNotices(prev=>[data,...prev])
        toast.success('Notice posted ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string) {
    if (!confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id',id)
    setNotices(prev=>prev.filter(n=>n.id!==id))
    toast.success('Notice deleted')
  }

  async function togglePublish(n:Notice) {
    const { data } = await supabase.from('notices').update({published:!n.published}).eq('id',n.id).select().single()
    if (data) { setNotices(prev=>prev.map(x=>x.id===n.id?data:x)); toast.success(data.published?'Published':'Hidden') }
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
            <span className="font-display font-bold text-slate-800 text-sm">Notices</span>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📢 Notices</h1>
            <p className="text-slate-500 text-sm mt-0.5">{notices.length} notices · {notices.filter(n=>n.published).length} published</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">➕ Post Notice</button>
          </div>
        </div>
        <div className="space-y-3">
          {notices.length===0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center"><div className="text-5xl mb-3">📢</div><p className="text-slate-500 font-semibold">No notices yet. Post your first one!</p></div>
          ) : notices.map(n=>(
            <div key={n.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-sm transition-all ${!n.published?'opacity-60 border-dashed border-slate-200':'border-slate-100'}`}>
              <div className="p-5 flex items-start gap-4 flex-wrap">
                <div className={`${typeColors[n.type]||'bg-slate-400'} text-white text-xs font-black px-3 py-1.5 rounded-xl flex-shrink-0 uppercase`}>{n.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-black text-slate-800">{n.title}</h3>
                    {n.important&&<span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-2 py-0.5 rounded-lg">🔴 Important</span>}
                    {!n.published&&<span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-lg">Hidden</span>}
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2">{n.content}</p>
                  <p className="text-slate-400 text-xs mt-1">📅 {n.date} · {n.posted_by} · for {n.audience}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={()=>openEdit(n)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors">✏️</button>
                  <button onClick={()=>togglePublish(n)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${n.published?'bg-amber-50 hover:bg-amber-100 text-amber-700':'bg-green-50 hover:bg-green-100 text-green-700'}`}>{n.published?'Hide':'Publish'}</button>
                  <button onClick={()=>handleDelete(n.id)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="font-display text-xl font-black text-slate-800">{editing?'✏️ Edit Notice':'📢 Post Notice'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Title *</label>
                <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Notice title..." className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Content *</label>
                <textarea value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} placeholder="Notice details..." rows={4} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="general">General</option><option value="exam">Exam</option><option value="holiday">Holiday</option><option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Audience</label>
                  <select value={form.audience} onChange={e=>setForm(p=>({...p,audience:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="all">All</option><option value="students">Students</option><option value="parents">Parents</option><option value="teachers">Teachers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Posted By</label>
                  <input value={form.posted_by} onChange={e=>setForm(p=>({...p,posted_by:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.important} onChange={e=>setForm(p=>({...p,important:e.target.checked}))} className="w-4 h-4 accent-red-500 rounded"/>
                  <span className="text-sm font-bold text-slate-600">🔴 Mark as Important</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={e=>setForm(p=>({...p,published:e.target.checked}))} className="w-4 h-4 accent-green-600 rounded"/>
                  <span className="text-sm font-bold text-slate-600">✅ Published</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                {editing?'✅ Update':'📢 Post Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
