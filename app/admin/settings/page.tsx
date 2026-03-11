'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Settings = { id:string; school_name:string; short_name:string; principal_name:string; established_year:string; phone:string; email:string; address:string; total_students:number; total_teachers:number; mission:string; vision:string }
const defaults = { school_name:'Government High School Babi Khel', short_name:'GHS Babi Khel', principal_name:'', established_year:'1989', phone:'', email:'', address:'Babi Khel, Khyber Pakhtunkhwa, Pakistan', total_students:450, total_teachers:18, mission:'To provide quality education with Islamic values, developing responsible citizens.', vision:'A school where every student reaches their full potential.' }

export default function AdminSettingsPage() {
  const [form, setForm] = useState(defaults)
  const [settingsId, setSettingsId] = useState('')
  const [loading, setLoading] = useState(true)
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
      const { data } = await supabase.from('school_settings').select('*').single()
      if (data) {
        setSettingsId(data.id)
        setForm({ school_name:data.school_name||defaults.school_name, short_name:data.short_name||defaults.short_name, principal_name:data.principal_name||'', established_year:data.established_year||'1989', phone:data.phone||'', email:data.email||'', address:data.address||defaults.address, total_students:data.total_students||450, total_teachers:data.total_teachers||18, mission:data.mission||defaults.mission, vision:data.vision||defaults.vision })
      }
      setLoading(false)
    }
    init()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (settingsId) {
        const { error } = await supabase.from('school_settings').update(payload).eq('id',settingsId)
        if (error) { toast.error(error.message); return }
      } else {
        const { data, error } = await supabase.from('school_settings').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setSettingsId(data.id)
      }
      toast.success('Settings saved ✅')
    } finally { setSaving(false) }
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
            <span className="font-display font-bold text-slate-800 text-sm">Settings</span>
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">⚙️ School Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Update school information shown on the website</p>
          </div>
          <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
        </div>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-display font-black text-slate-700 mb-4 flex items-center gap-2"><span>🏫</span> Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">School Name</label>
                <input value={form.school_name} onChange={e=>setForm(p=>({...p,school_name:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Short Name</label>
                <input value={form.short_name} onChange={e=>setForm(p=>({...p,short_name:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Established Year</label>
                <input value={form.established_year} onChange={e=>setForm(p=>({...p,established_year:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Principal Name</label>
                <input value={form.principal_name} onChange={e=>setForm(p=>({...p,principal_name:e.target.value}))} placeholder="Enter principal's full name" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="03xx-xxxxxxx" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="school@email.com" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Address</label>
                <input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-display font-black text-slate-700 mb-4 flex items-center gap-2"><span>📊</span> Stats (shown on homepage)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Students</label>
                <input type="number" min={0} value={form.total_students} onChange={e=>setForm(p=>({...p,total_students:Number(e.target.value)}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Teachers</label>
                <input type="number" min={0} value={form.total_teachers} onChange={e=>setForm(p=>({...p,total_teachers:Number(e.target.value)}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-display font-black text-slate-700 mb-4 flex items-center gap-2"><span>🎯</span> Mission & Vision</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Mission Statement</label>
                <textarea value={form.mission} onChange={e=>setForm(p=>({...p,mission:e.target.value}))} rows={3} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Vision Statement</label>
                <textarea value={form.vision} onChange={e=>setForm(p=>({...p,vision:e.target.value}))} rows={3} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-base">
            {saving&&<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner"/>}
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
