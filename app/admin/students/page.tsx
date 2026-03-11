'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Student = {
  id: string; student_id: string; full_name: string; father_name: string
  class: string; section: string; roll_no: string; gender: string; status: string; phone: string
}

const CLASSES = ['6','7','8','9','10']
const SECTIONS = ['A','B','C']

export default function AdminStudentsPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState({ full_name:'', father_name:'', class:'6', section:'A', roll_no:'', gender:'Male', phone:'', student_id:'' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('students').select('*').order('class').order('roll_no')
    if (filterClass) q = q.eq('class', filterClass)
    const { data } = await q
    setStudents(data || [])
    setLoading(false)
  }, [filterClass])

  useEffect(() => { load() }, [load])

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditing(null)
    setForm({ full_name:'', father_name:'', class:'6', section:'A', roll_no:'', gender:'Male', phone:'', student_id:'' })
    setShowForm(true)
  }

  function openEdit(s: Student) {
    setEditing(s)
    setForm({ full_name: s.full_name, father_name: s.father_name||'', class: s.class, section: s.section, roll_no: s.roll_no, gender: s.gender, phone: s.phone||'', student_id: s.student_id })
    setShowForm(true)
  }

  async function save() {
    if (!form.full_name || !form.roll_no || !form.student_id) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('students').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
        if (error) throw error
        toast.success('Student updated!')
      } else {
        const { error } = await supabase.from('students').insert({ ...form })
        if (error) throw error
        toast.success('Student added!')
      }
      setShowForm(false)
      load()
    } catch (e: any) { toast.error(e.message || 'Error saving') }
    finally { setSaving(false) }
  }

  async function deleteStudent(id: string) {
    if (!confirm('Delete this student?')) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) { toast.error('Error deleting'); return }
    toast.success('Deleted')
    load()
  }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">🎓 Students</h1>
            <p className="text-slate-500 text-sm">{students.length} total students</p>
          </div>
          <button onClick={openAdd}
            className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm">
            + Add Student
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, roll..."
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-green-400 flex-1 min-w-48" />
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎓</div>
              <p className="text-slate-400 font-semibold">No students found</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Add First Student</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Student ID','Name','Father','Class','Roll No','Gender','Phone','Status','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.student_id}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{s.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{s.father_name}</td>
                      <td className="px-4 py-3"><span className="bg-green-50 text-green-700 font-bold text-xs px-2 py-1 rounded-lg">Class {s.class}{s.section}</span></td>
                      <td className="px-4 py-3 text-slate-600">{s.roll_no}</td>
                      <td className="px-4 py-3 text-slate-500">{s.gender}</td>
                      <td className="px-4 py-3 text-slate-500">{s.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(s)} className="text-xs font-bold text-sky-600 hover:text-sky-800 px-2 py-1 rounded-lg hover:bg-sky-50 transition-all">Edit</button>
                          <button onClick={() => deleteStudent(s.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">Del</button>
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Student' : 'Add New Student'}</h2>
            <div className="space-y-3">
              {[
                { label:'Student ID *', key:'student_id', placeholder:'e.g. GHS-2024-001' },
                { label:'Full Name *', key:'full_name', placeholder:"Student's full name" },
                { label:"Father's Name", key:'father_name', placeholder:"Father's name" },
                { label:'Roll Number *', key:'roll_no', placeholder:'e.g. 01' },
                { label:'Phone', key:'phone', placeholder:'Contact number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    placeholder={f.placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={form.class} onChange={e => setForm(p => ({...p, class: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Section</label>
                  <select value={form.section} onChange={e => setForm(p => ({...p, section: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm(p => ({...p, gender: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={save} disabled={saving}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
                {saving ? 'Saving...' : (editing ? 'Update' : 'Add Student')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
