'use client'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CLASSES = ['6','7','8','9','10']
const SECTIONS = ['A','B','C']

type Student = {
  id: string; student_id: string; full_name: string; father_name: string
  class: string; section: string; roll_no: string; gender: string
  phone?: string; address?: string; admitted_year?: string
  status: string; photo_url?: string; created_at: string
}

const empty = { student_id:'', full_name:'', father_name:'', class:'9', section:'A', roll_no:'', gender:'Male', phone:'', address:'', admitted_year:new Date().getFullYear().toString(), status:'active' }

export default function StudentsClient({ initialStudents }: { initialStudents: Student[] }) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Student|null>(null)
  const [form, setForm] = useState(empty)
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.full_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.roll_no.includes(q)
    const matchClass = !filterClass || s.class === filterClass
    return matchSearch && matchClass
  })

  function openAdd() { setEditing(null); setForm(empty); setPhotoFile(null); setShowModal(true) }
  function openEdit(s: Student) { setEditing(s); setForm({student_id:s.student_id,full_name:s.full_name,father_name:s.father_name,class:s.class,section:s.section,roll_no:s.roll_no,gender:s.gender,phone:s.phone||'',address:s.address||'',admitted_year:s.admitted_year||'',status:s.status}); setPhotoFile(null); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null); setForm(empty) }

  async function uploadPhoto(studentId: string): Promise<string|null> {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `students/${studentId}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!form.student_id || !form.full_name || !form.class || !form.roll_no) { toast.error('Fill required fields'); return }
    setUploading(true)
    try {
      let photoUrl = editing?.photo_url || null
      const tmpId = editing?.id || form.student_id
      if (photoFile) { const url = await uploadPhoto(tmpId); if (url) photoUrl = url }

      if (editing) {
        const { data, error } = await supabase.from('students').update({...form, photo_url:photoUrl, updated_at:new Date().toISOString()}).eq('id', editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setStudents(prev => prev.map(s => s.id === editing.id ? data : s))
        toast.success('Student updated ✅')
      } else {
        const { data, error } = await supabase.from('students').insert({...form, photo_url:photoUrl}).select().single()
        if (error) { toast.error(error.message); return }
        setStudents(prev => [data, ...prev])
        toast.success('Student added ✅')
      }
      closeModal()
    } finally { setUploading(false) }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setStudents(prev => prev.filter(s => s.id !== id))
    toast.success('Student deleted')
  }

  const statuses: Record<string, string> = { active:'bg-green-50 text-green-700 border-green-200', inactive:'bg-slate-100 text-slate-600 border-slate-200', transferred:'bg-amber-50 text-amber-700 border-amber-200' }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>🎓 Student Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{students.length} total students registered</p>
        </div>
        <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name, ID or roll no..."
          className="flex-1 min-w-48 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors" />
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)}
          className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 bg-white">
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <span className="text-slate-400 text-sm font-semibold">{filtered.length} shown</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Class</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Roll No</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Father</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">
                  <div className="text-4xl mb-2">🎓</div>
                  <p className="font-semibold">{search||filterClass ? 'No students match your search' : 'No students yet. Add your first student!'}</p>
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.photo_url
                        ? <img src={s.photo_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                        : <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center text-white text-sm font-black flex-shrink-0">{s.full_name?.[0]}</div>
                      }
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{s.full_name}</div>
                        <div className="text-xs text-slate-400">{s.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{s.student_id}</td>
                  <td className="px-4 py-3"><span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-lg">Class {s.class}{s.section}</span></td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-600">{s.roll_no}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{s.father_name||'—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statuses[s.status]||statuses.active}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors text-sm">✏️</button>
                      <button onClick={() => handleDelete(s.id, s.full_name)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors text-sm">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{editing ? '✏️ Edit Student' : '➕ Add New Student'}</h2>
              <button onClick={closeModal} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg transition-colors">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {/* Photo upload */}
              <div className="col-span-2 flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoFile ? <img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" alt="" />
                    : editing?.photo_url ? <img src={editing.photo_url} className="w-full h-full object-cover" alt="" />
                    : <span className="text-3xl">👤</span>}
                </div>
                <div>
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors inline-block">
                    📷 Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0]||null)} />
                  </label>
                  <p className="text-slate-400 text-xs mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>

              {[
                {key:'student_id',label:'Student ID *',ph:'GHS-2025-001',col:1},
                {key:'roll_no',label:'Roll Number *',ph:'01',col:1},
                {key:'full_name',label:'Full Name *',ph:'Muhammad Ali',col:2},
                {key:'father_name',label:"Father's Name",ph:"Father's full name",col:2},
                {key:'phone',label:'Phone',ph:'0300-0000000',col:1},
                {key:'admitted_year',label:'Admitted Year',ph:'2024',col:1},
                {key:'address',label:'Address',ph:'Village/Town',col:2},
              ].map(f => (
                <div key={f.key} className={f.col===2?'col-span-2':''}>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class *</label>
                <select value={form.class} onChange={e=>setForm(p=>({...p,class:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Section *</label>
                <select value={form.section} onChange={e=>setForm(p=>({...p,section:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  {SECTIONS.map(s=><option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Gender</label>
                <select value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option>Male</option><option>Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={closeModal} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={uploading}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {uploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : <>{editing?'✅ Update Student':'➕ Add Student'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
