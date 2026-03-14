'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Settings = { id:string; school_name:string; short_name:string; principal_name:string; established_year:string; phone:string; email:string; address:string; logo_url?:string; total_students:number; total_teachers:number; mission:string; vision:string }

export default function SettingsClient({ initialSettings }: { initialSettings: Settings|null }) {
  const [form, setForm] = useState(initialSettings || { id:'', school_name:'Government High School Babi Khel', short_name:'GHS Babi Khel', principal_name:'', established_year:'1989', phone:'', email:'', address:'Babi Khel, Khyber Pakhtunkhwa, Pakistan', total_students:450, total_teachers:18, mission:'To provide quality education with Islamic values.', vision:'A school where every student reaches their full potential.' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase.from('school_settings').update({...form, updated_at:new Date().toISOString()}).eq('id', form.id)
      if (error) { toast.error(error.message); return }
      toast.success('School settings saved ✅ — Website updated!')
    } finally { setSaving(false) }
  }

  const Field = ({ label, k, type='text', ph='', rows=0 }: { label:string; k:keyof typeof form; type?:string; ph?:string; rows?:number }) => (
    <div>
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      {rows > 0
        ? <textarea value={String(form[k])} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} rows={rows} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors" />
        : <input type={type} value={String(form[k])} onChange={e=>setForm(p=>({...p,[k]:type==='number'?Number(e.target.value):e.target.value}))} placeholder={ph} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
      }
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>⚙️ School Settings</h1>
          <p className="text-slate-500 text-sm">Changes here update the live website immediately</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save All Settings'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🏫 Basic Information</h2>
          <Field label="School Full Name" k="school_name" ph="Government High School Babi Khel" />
          <Field label="Short Name" k="short_name" ph="GHS Babi Khel" />
          <Field label="Principal Name" k="principal_name" ph="Mr. / Mrs. Full Name" />
          <Field label="Established Year" k="established_year" ph="1989" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📞 Contact Details</h2>
          <Field label="Phone Number" k="phone" ph="0300-0000000" />
          <Field label="Email Address" k="email" ph="school@email.com" />
          <Field label="Full Address" k="address" ph="Village, District, KPK" rows={3} />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📊 School Statistics</h2>
          <Field label="Total Students" k="total_students" type="number" />
          <Field label="Total Teachers" k="total_teachers" type="number" />
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>💬 Mission & Vision</h2>
          <Field label="Mission Statement" k="mission" rows={4} />
          <Field label="Vision Statement" k="vision" rows={4} />
        </div>
      </div>
    </div>
  )
}
