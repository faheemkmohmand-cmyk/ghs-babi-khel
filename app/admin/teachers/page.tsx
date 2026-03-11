'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer Science','General Science','Social Studies','Arabic','Physical Education','Art']
type Teacher = { id:string; full_name:string; subject:string; department:string; role:string; qualification:string; experience_years:number; phone:string; email:string; joined_year:string; status:string; photo_url:string; bio:string }
const emptyForm = { full_name:'', subject:'Mathematics', department:'General', role:'Teacher', qualification:'', experience_years:0, phone:'', email:'', joined_year:new Date().getFullYear().toString(), status:'active', photo_url:'', bio:'' }

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Teacher|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<{full_name:string}|null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id',user.id).single()
      if (!p || p.role!=='admin') { window.location.href='/dashboard'; return }
      setProfile(p)
      const { data } = await supabase.from('teachers').select('*').order('full_name')
      setTeachers(data||[])
      setLoading(false)
    }
    init()
  }, [])

  function openAdd() { setEditing(null); setForm(emptyForm); setPhotoFile(null); setShowModal(true) }
  function openEdit(t:Teacher) {
    setEditing(t); setPhotoFile(null)
    setForm({ full_name:t.full_name, subject:t.subject, department:t.department||'General', role:t.role||'Teacher', qualification:t.qualification||'', experience_years:t.experience_years||0, phone:t.phone||'', email:t.email||'', joined_year:t.joined_year||'', status:t.status, photo_url:t.photo_url||'', bio:t.bio||'' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.full_name||!form.subject) { toast.error('Name and subject are required'); return }
    setSaving(true)
    try {
      let photo_url = editing?.photo_url||''
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `teachers/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path,photoFile,{upsert:true})
        if (!upErr) photo_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }
      const payload = { ...form, photo_url }
      if (editing) {
        const { data, error } = await supabase.from('teachers').update(payload).eq('id',editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setTeachers(prev=>prev.map(t=>t.id===editing.id?data:t))
        toast.success('Teacher updated ✅')
      } else {
        const { data, error } = await supabase.from('teachers').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setTeachers(prev=>[...prev,data])
        toast.success('Teacher added ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string, name:string) {
    if (!confirm(`Delete teacher "${name}"?`)) return
    const { error } = await supabase.from('teachers').delete().eq('id',id)
    if (error) { toast.error(error.message); return }
    setTeachers(prev=>prev.filter(t=>t.id!==id))
    toast.success('Teacher deleted')
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
            <span className="font-display font-bold text-slate-800 text-sm">Teachers</span>
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
            <h1 className="font-display text-2xl font-black text-slate-800">👨‍🏫 Teachers</h1>
            <p className="text-slate-500 text-sm mt-0.5">{teachers.length} staff · {teachers.filter(t=>t.status==='active').length} active</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">➕ Add Teacher</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {teachers.length===0 ? (
            <div className="col-span-4 bg-white rounded-3xl border border-slate-100 p-16 text-center"><div className="text-5xl mb-3">👨‍🏫</div><p className="text-slate-500 font-semibold">No teachers yet. Add your first teacher!</p></div>
          ) : teachers.map(t=>(
            <div key={t.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${t.status!=='active'?'opacity-60 border-dashed border-slate-200':'border-slate-100'}`}>
              <div className="p-5 text-center">
                {t.photo_url
                  ? <img src={t.photo_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-slate-100" alt=""/>
                  : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white font-black text-xl mx-auto mb-3">{t.full_name?.[0]?.toUpperCase()}</div>}
                <p className="font-black text-slate-800">{t.full_name}</p>
                <p className="text-green-900 text-sm font-bold mt-0.5">{t.subject}</p>
                <p className="text-slate-400 text-xs mt-0.5">{t.qualification||t.department}</p>
                {t.experience_years>0 && <p className="text-slate-400 text-xs">{t.experience_years} yrs exp</p>}
                <span className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full border ${t.status==='active'?'bg-green-50 text-green-700 border-green-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>{t.status}</span>
              </div>
              <div className="flex border-t border-slate-100">
                <button onClick={()=>openEdit(t)} className="flex-1 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors">✏️ Edit</button>
                <button onClick={()=>handleDelete(t.id,t.full_name)} className="flex-1 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-l border-slate-100">🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="font-display text-xl font-black text-slate-800">{editing?'✏️ Edit Teacher':'👨‍🏫 Add Teacher'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoFile?<img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" alt=""/>
                    :form.photo_url?<img src={form.photo_url} className="w-full h-full object-cover" alt=""/>
                    :<span className="text-2xl">👨‍🏫</span>}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                  📷 Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setPhotoFile(e.target.files?.[0]||null)}/>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} placeholder="Teacher full name" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject *</label>
                  <select value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Experience (yrs)</label>
                  <input type="number" min={0} value={form.experience_years} onChange={e=>setForm(p=>({...p,experience_years:Number(e.target.value)}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                {[{k:'qualification',l:'Qualification',ph:'e.g. M.Sc Mathematics'},{k:'role',l:'Designation',ph:'e.g. Subject Teacher'},{k:'phone',l:'Phone',ph:'03xx-xxxxxxx'},{k:'email',l:'Email',ph:'teacher@email.com'},{k:'joined_year',l:'Joined Year',ph:'2020'}].map(f=>(
                  <div key={f.k}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.l}</label>
                    <input value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="active">Active</option><option value="on-leave">On Leave</option><option value="retired">Retired</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Bio</label>
                  <textarea value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Brief description..." rows={2} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                {editing?'✅ Update':'👨‍🏫 Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
