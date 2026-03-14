'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CLASSES = ['6', '7', '8', '9', '10']
const SECTIONS = ['A', 'B', 'C']

type Student = {
  id: string
  student_id: string
  full_name: string
  father_name: string
  class: string
  section: string
  roll_no: string
  gender: string
  phone: string
  address: string
  admitted_year: string
  status: string
  photo_url: string
  created_at: string
}

const emptyForm = {
  student_id: '', full_name: '', father_name: '', class: '9', section: 'A',
  roll_no: '', gender: 'Male', phone: '', address: '', admitted_year: new Date().getFullYear().toString(),
  status: 'active', photo_url: '',
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).single()
      if (!p || p.role !== 'admin') { window.location.href = '/dashboard'; return }
      setProfile(p)
      const { data } = await supabase.from('students').select('*').order('class').order('roll_no')
      setStudents(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = students.filter(s => {
    const matchSearch = !search || s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) || s.roll_no.includes(search)
    const matchClass = !filterClass || s.class === filterClass
    return matchSearch && matchClass
  })

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setPhotoFile(null)
    setShowModal(true)
  }

  function openEdit(s: Student) {
    setEditing(s)
    setPhotoFile(null)
    setForm({
      student_id: s.student_id, full_name: s.full_name, father_name: s.father_name || '',
      class: s.class, section: s.section, roll_no: s.roll_no, gender: s.gender || 'Male',
      phone: s.phone || '', address: s.address || '', admitted_year: s.admitted_year || '',
      status: s.status || 'active', photo_url: s.photo_url || '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.full_name || !form.student_id || !form.roll_no) {
      toast.error('Name, Student ID and Roll No are required')
      return
    }
    setSaving(true)
    try {
      let photo_url = editing?.photo_url || ''
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `students/${form.student_id}.${ext}`
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
        if (!upErr) {
          photo_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
        }
      }
      const payload = { ...form, photo_url }
      if (editing) {
        const { data, error } = await supabase.from('students').update(payload).eq('id', editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setStudents(prev => prev.map(s => s.id === editing.id ? data : s))
        toast.success('Student updated ✅')
      } else {
        const { data, error } = await supabase.from('students').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setStudents(prev => [...prev, data])
        toast.success('Student added ✅')
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setStudents(prev => prev.filter(s => s.id !== id))
    toast.success('Student deleted')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full spinner mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-slate-800 text-sm">Students</span>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">🎓 Students</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} of {students.length} students</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">
              ➕ Add Student
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 flex flex-wrap gap-3 items-center">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by name, ID or roll no..."
            className="flex-1 min-w-[200px] border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors"
          />
          <div className="flex gap-1.5">
            <button onClick={() => setFilterClass('')} className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${!filterClass ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>All</button>
            {CLASSES.map(c => (
              <button key={c} onClick={() => setFilterClass(c === filterClass ? '' : c)} className={`px-3 py-2 rounded-xl text-xs font-black border-2 transition-all ${filterClass === c ? 'bg-green-900 text-white border-green-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>Cls {c}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">ID / Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Father</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="text-4xl mb-2">🎓</div>
                    <p className="font-semibold">{search || filterClass ? 'No students match your search' : 'No students yet. Add your first one!'}</p>
                  </td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.photo_url
                          ? <img src={s.photo_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-slate-100" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{s.full_name?.[0]?.toUpperCase()}</div>
                        }
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-700">{s.student_id}</p>
                      <p className="text-xs text-slate-400">Roll: {s.roll_no}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-lg">{s.class}{s.section}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.father_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : s.status === 'inactive' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors text-sm">✏️</button>
                        <button onClick={() => handleDelete(s.id, s.full_name)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="font-display text-xl font-black text-slate-800">{editing ? '✏️ Edit Student' : '🎓 Add Student'}</h2>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoFile
                    ? <img src={URL.createObjectURL(photoFile)} className="w-full h-full object-cover" alt="" />
                    : form.photo_url
                      ? <img src={form.photo_url} className="w-full h-full object-cover" alt="" />
                      : <span className="text-2xl">🎓</span>}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
                  📷 Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: 'full_name', l: 'Full Name *', ph: 'Student full name' },
                  { k: 'father_name', l: "Father's Name", ph: "Father's full name" },
                  { k: 'student_id', l: 'Student ID *', ph: 'e.g. GHS-2025-001' },
                  { k: 'roll_no', l: 'Roll Number *', ph: 'e.g. 01' },
                  { k: 'phone', l: 'Phone', ph: '03xx-xxxxxxx' },
                  { k: 'admitted_year', l: 'Admitted Year', ph: '2024' },
                  { k: 'address', l: 'Address', ph: 'Village/Town, District', span: true },
                ].map(f => (
                  <div key={f.k} className={f.span ? 'col-span-2' : ''}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.l}</label>
                    <input
                      value={(form as any)[f.k]}
                      onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                      placeholder={f.ph}
                      className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Class *</label>
                  <select value={form.class} onChange={e => setForm(p => ({ ...p, class: e.target.value }))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Section *</label>
                  <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />}
                {editing ? '✅ Update Student' : '🎓 Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
