'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Teacher = { id: string; full_name: string; subject: string; department: string; role: string; qualification: string; experience_years: number; phone: string; status: string }

export default function AdminTeachersPage() {
  const supabase = createClient()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name:'', subject:'', department:'General', role:'', qualification:'', experience_years:0, phone:'', status:'active' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('teachers').select('*').order('full_name')
    setTeachers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setForm({ full_name:'', subject:'', department:'General', role:'', qualification:'', experience_years:0, phone:'', status:'active' }); setShowForm(true) }
  function openEdit(t: Teacher) { setEditing(t); setForm({ full_name:t.full_name, subject:t.subject, department:t.department||'General', role:t.role||'', qualification:t.qualification||'', experience_years:t.experience_years||0, phone:t.phone||'', status:t.status }); setShowForm(true) }

  async function save() {
    if (!form.full_name || !form.subject) { toast.error('Name and subject required'); return }
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('teachers').update(form).eq('id', editing.id)
        if (error) throw error
        toast.success('Teacher updated!')
      } else {
        const { error } = await supabase.from('teachers').insert(form)
        if (error) throw error
        toast.success('Teacher added!')
      }
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this teacher?')) return
    await supabase.from('teachers').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">👨‍🏫 Teachers</h1>
            <p className="text-slate-500 text-sm">{teachers.length} staff members</p>
          </div>
          <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">+ Add Teacher</button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? <div className="col-span-4 text-center py-16 text-slate-400">Loading...</div>
          : teachers.length === 0 ? (
            <div className="col-span-4 bg-white rounded-2xl border border-slate-100 text-center py-16">
              <div className="text-5xl mb-3">👨‍🏫</div>
              <p className="text-slate-400 font-semibold">No teachers yet</p>
              <button onClick={openAdd} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Add First Teacher</button>
            </div>
          ) : teachers.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
                {t.full_name?.[0]?.toUpperCase()}
              </div>
              <div className="text-center mb-3">
                <h3 className="font-black text-slate-800 leading-snug">{t.full_name}</h3>
                <p className="text-green-800 text-sm font-bold mt-0.5">{t.subject}</p>
                {t.role && <p className="text-slate-400 text-xs">{t.role}</p>}
                {t.qualification && <p className="text-slate-400 text-xs">{t.qualification}</p>}
                <p className="text-slate-400 text-xs mt-1">{t.experience_years} yrs exp · {t.department}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="flex-1 text-xs font-bold text-sky-600 border border-sky-200 py-1.5 rounded-lg hover:bg-sky-50 transition-all">Edit</button>
                <button onClick={() => del(t.id)} className="flex-1 text-xs font-bold text-red-500 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">{editing ? 'Edit Teacher' : 'Add Teacher'}</h2>
            <div className="space-y-3">
              {[
                { label:'Full Name *', key:'full_name', placeholder:'Teacher full name' },
                { label:'Subject *', key:'subject', placeholder:'e.g. Mathematics' },
                { label:'Department', key:'department', placeholder:'e.g. Science' },
                { label:'Role/Designation', key:'role', placeholder:'e.g. Head Teacher' },
                { label:'Qualification', key:'qualification', placeholder:'e.g. M.Sc Mathematics' },
                { label:'Phone', key:'phone', placeholder:'Contact number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Experience (Years)</label>
                  <input type="number" min="0" value={form.experience_years} onChange={e => setForm(p => ({...p, experience_years: parseInt(e.target.value)||0}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : (editing ? 'Update' : 'Add Teacher')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
