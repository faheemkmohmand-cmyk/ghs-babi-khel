'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'


const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Urdu','Islamiat','Pakistan Studies','Computer Science','History','Geography','Arabic','Physical Education','Art','General Science']
const DEPTS = ['Science','Arts','Languages','Islamic Studies','Physical Education','Computer','General']

type Teacher = {
  id:string; full_name:string; subject:string; department:string; role?:string
  qualification?:string; experience_years?:number; phone?:string; email?:string
  joined_year?:string; status:string; photo_url?:string; bio?:string; created_at:string
}
const emptyForm = { full_name:'', subject:'Mathematics', department:'Science', role:'Subject Teacher', qualification:'', experience_years:0, phone:'', email:'', joined_year:new Date().getFullYear().toString(), status:'active', bio:'' }

export default function TeachersClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const supabase = createClient()

  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Teacher|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)

  const filtered = teachers.filter(t => !search || t.full_name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditing(null); setForm(emptyForm); setPhotoFile(null); setShowModal(true) }
  function openEdit(t: Teacher) {
    setEditing(t)
    setForm({ full_name:t.full_name, subject:t.subject, department:t.department, role:t.role||'Subject Teacher', qualification:t.qualification||'', experience_years:t.experience_years||0, phone:t.phone||'', email:t.email||'', joined_year:t.joined_year||'', status:t.status, bio:t.bio||'' })
    setPhotoFile(null); setShowModal(true)
  }

  async function uploadPhoto(id: string): Promise<string|null> {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `teachers/${id}.${ext}`
    await supabase.storage.from('avatars').upload(path, photoFile, { upsert:true })
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.full_name || !form.subject) { toast.error('Name and subject are required'); return }
    setUploading(true)
    try {
      let photoUrl = editing?.photo_url || null
      if (photoFile) { const url = await uploadPhoto(editing?.id || 'new'); if (url) photoUrl = url }
      if (editing) {
        const { data, error } = await supabase.from('teachers').update({...form, photo_url:photoUrl} as any).eq('id', editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setTeachers(prev => prev.map(t => t.id === editing.id ? data : t))
        toast.success('Teacher updated ✅')
      } else {
        const { data, error } = await supabase.from('teachers').insert({...form, photo_url:photoUrl} as any).select().single()
        if (error) { toast.error(error.message); return }
        setTeachers(prev => [...prev, data])
        toast.success('Teacher added ✅')
      }
      setShowModal(false)
    } finally { setUploading(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return
    await supabase.from('teachers').delete().eq('id', id)
    setTeachers(prev => prev.filter(t => t.id !== id))
    toast.success('Teacher deleted')
  }

  const statusColors: Record<string,string> = { active:'bg-green-50 text-green-700 border-green-200', 'on-leave':'bg-amber-50 text-amber-700 border-amber-200', retired:'bg-slate-100 text-slate-500 border-slate-200' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>👨‍🏫 Teacher Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{teachers.length} teachers on record</p>
        </div>
        <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search teachers by name or subject..."
          className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">👨‍🏫</div>
            <p className="text-slate-500 font-semibold">{search ? 'No teachers match your search' : 'No teachers added yet'}</p>
          </div>
        ) : filtered.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {t.photo_url
                  ? <img src={t.photo_url} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>{t.full_name?.[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 truncate">{t.full_name}</h3>
                <p className="text-green-900 text-sm font-bold">{t.subject}</p>
                <p className="text-slate-400 text-xs mt-0.5">{t.role} · {t.department}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${statusColors[t.status]||statusColors.active}`}>{t.status}</span>
                  {t.experience_years ? <span className="text-xs text-slate-400">{t.experience_years}y exp</span> : null}
                  {t.qualification ? <span className="text-xs text-slate-400">{t.qualification}</span> : null}
                </div>
              </div>
            </div>
            {t.bio && <p className="text-slate-500 text-xs mt-3 line-clamp-2 leading-relaxed">{t.bio}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={()=>openEdit(t)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm py-2 rounded-xl transition-colors">✏️ Edit</button>
              <button onClick={()=>handleDelete(t.id,t.full_name)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm py-2 rounded-xl transition-colors">🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing?'✏️ Edit Teacher':'➕ Add Teacher'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoFile ? <img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" alt="" />
                    : editing?.photo_url ? <img src={editing.photo_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-3xl">👤</span>}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                  📷 Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e=>setPhotoFile(e.target.files?.[0]||null)} />
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} placeholder="Mr. Muhammad Ahmed"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Role/Position</label>
                <input value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} placeholder="Subject Teacher"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Qualification</label>
                <input value={form.qualification} onChange={e=>setForm(p=>({...p,qualification:e.target.value}))} placeholder="MSc, B.Ed"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="0300-0000000"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="teacher@gmail.com"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Years Experience</label>
                <input type="number" value={form.experience_years} onChange={e=>setForm(p=>({...p,experience_years:Number(e.target.value)}))} placeholder="5"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Joined Year</label>
                <input value={form.joined_year} onChange={e=>setForm(p=>({...p,joined_year:e.target.value}))} placeholder="2020"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject *</label>
                <select value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="active">Active</option><option value="on-leave">On Leave</option><option value="retired">Retired</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Bio / Short Description</label>
                <textarea value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Brief description about the teacher..." rows={3}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {uploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : editing ? '✅ Update' : '➕ Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
