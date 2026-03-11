'use client'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState('')
  const [form, setForm] = useState({
    school_name: 'Government High School Babi Khel',
    short_name: 'GHS Babi Khel',
    principal_name: '',
    established_year: '1989',
    phone: '',
    email: '',
    address: 'Babi Khel, Khyber Pakhtunkhwa, Pakistan',
    total_students: 450,
    total_teachers: 18,
    mission: 'To provide quality education with Islamic values, developing responsible citizens.',
    vision: 'A school where every student reaches their full potential.',
  })

  useEffect(() => {
    supabase.from('school_settings').select('*').single().then(({ data }) => {
      if (data) { setSettingsId(data.id); setForm({ ...form, ...data }) }
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { error } = await supabase.from('school_settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', settingsId)
      if (error) throw error
      toast.success('Settings saved!')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <AdminLayout adminName=""><div className="text-center py-16 text-slate-400">Loading...</div></AdminLayout>

  return (
    <AdminLayout adminName="">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800">⚙️ School Settings</h1>
          <p className="text-slate-500 text-sm">Update school information shown on the website</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-widest border-b border-slate-100 pb-3">Basic Information</h2>
          {[
            { label:'School Name', key:'school_name' },
            { label:'Short Name', key:'short_name' },
            { label:'Principal Name', key:'principal_name' },
            { label:'Established Year', key:'established_year' },
            { label:'Phone', key:'phone' },
            { label:'Email', key:'email' },
            { label:'Address', key:'address' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Students</label>
              <input type="number" value={form.total_students} onChange={e => setForm(p => ({...p, total_students: parseInt(e.target.value)||0}))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Teachers</label>
              <input type="number" value={form.total_teachers} onChange={e => setForm(p => ({...p, total_teachers: parseInt(e.target.value)||0}))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-widest border-b border-slate-100 pb-3">Mission & Vision</h2>
          {[
            { label:'Mission Statement', key:'mission' },
            { label:'Vision Statement', key:'vision' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
              <textarea value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none" />
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all">
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </AdminLayout>
  )
}
