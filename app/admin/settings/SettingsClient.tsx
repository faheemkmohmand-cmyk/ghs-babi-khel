'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Settings = {
  id: string
  school_name: string
  short_name: string
  principal_name: string
  established_year: string
  phone: string
  email: string
  address: string
  logo_url: string
  banner_url: string
  banner_text: string
  total_students: number
  total_teachers: number
  mission: string
  vision: string
}

const DEFAULTS: Settings = {
  id: '', school_name: 'Government High School Babi Khel', short_name: 'GHS Babi Khel',
  principal_name: '', established_year: '1989', phone: '', email: '',
  address: 'Babi Khel, Khyber Pakhtunkhwa, Pakistan',
  logo_url: '', banner_url: '', banner_text: '',
  total_students: 450, total_teachers: 18,
  mission: 'To provide quality education with Islamic values.',
  vision: 'A school where every student reaches their full potential.',
}

export default function SettingsClient({ initialSettings }: { initialSettings: Settings | null }) {
  const [form, setForm]       = useState<Settings>(initialSettings || DEFAULTS)
  const [saving, setSaving]   = useState(false)
  const [logoUploading, setLogoUploading]     = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const logoRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const supabase  = createClient()

  function set(k: keyof Settings, v: any) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function uploadImage(file: File, path: string): Promise<string | null> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ghs_uploads')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      if (!res.ok) return null
      const json = await res.json()
      return json.secure_url
    } catch { return null }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const url = await uploadImage(file, 'logo')
    if (url) { set('logo_url', url); toast.success('Logo uploaded ✅') }
    else toast.error('Logo upload failed')
    setLogoUploading(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    const url = await uploadImage(file, 'banner')
    if (url) { set('banner_url', url); toast.success('Banner uploaded ✅') }
    else toast.error('Banner upload failed')
    setBannerUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form, updated_at: new Date().toISOString() }
      let error
      if (form.id) {
        ({ error } = await supabase.from('school_settings').update(payload).eq('id', form.id))
      } else {
        const { data, error: e } = await supabase.from('school_settings').insert(payload).select().single()
        error = e
        if (data) setForm(data)
      }
      if (error) { toast.error(error.message); return }
      toast.success('All settings saved ✅ — Website updated!')
    } finally { setSaving(false) }
  }

  const Field = ({ label, k, type = 'text', ph = '', rows = 0 }: { label: string; k: keyof Settings; type?: string; ph?: string; rows?: number }) => (
    <div>
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      {rows > 0
        ? <textarea value={String(form[k])} onChange={e => set(k, e.target.value)} placeholder={ph} rows={rows}
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
        : <input type={type} value={String(form[k])} onChange={e => set(k, type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={ph}
            className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
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
        <button onClick={handleSave} disabled={saving}
          className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save All Settings'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Logo */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🖼️ School Logo</h2>
          <p className="text-slate-400 text-xs">This logo appears in the navbar and header across the website</p>
          <div className="flex items-center gap-4 flex-wrap">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow"/>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl border-2 border-dashed border-slate-200">🏫</div>
            )}
            <div className="flex-1 space-y-2">
              <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${logoUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                {logoUploading ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>Uploading...</> : '📤 Upload Logo'}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={handleLogoUpload}/>
              </label>
              {form.logo_url && (
                <button onClick={() => set('logo_url', '')} className="block text-red-400 hover:text-red-600 text-xs font-bold transition-colors">
                  🗑️ Remove logo
                </button>
              )}
              <p className="text-slate-400 text-xs">Recommended: square image, PNG or JPG</p>
            </div>
          </div>
          {form.logo_url && (
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Or paste image URL directly</label>
              <input type="text" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..."
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🖼️ Hero Banner Image</h2>
          <p className="text-slate-400 text-xs">This image appears as the background of the homepage hero section</p>
          <div className="flex items-center gap-4 flex-wrap">
            {form.banner_url ? (
              <img src={form.banner_url} alt="Banner" className="w-32 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow"/>
            ) : (
              <div className="w-32 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl border-2 border-dashed border-slate-200">🌄</div>
            )}
            <div className="flex-1 space-y-2">
              <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${bannerUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                {bannerUploading ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>Uploading...</> : '📤 Upload Banner'}
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" disabled={bannerUploading} onChange={handleBannerUpload}/>
              </label>
              {form.banner_url && (
                <button onClick={() => set('banner_url', '')} className="block text-red-400 hover:text-red-600 text-xs font-bold transition-colors">
                  🗑️ Remove banner
                </button>
              )}
              <p className="text-slate-400 text-xs">Recommended: wide image, 1920×600px</p>
            </div>
          </div>
          <Field label="Homepage Announcement Text" k="banner_text" ph="e.g. Admissions open for 2026 — Contact school office" rows={2}/>
          <p className="text-slate-400 text-xs">This text appears as a banner/announcement at the top of the homepage</p>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🏫 Basic Information</h2>
          <Field label="School Full Name" k="school_name" ph="Government High School Babi Khel"/>
          <Field label="Short Name" k="short_name" ph="GHS Babi Khel"/>
          <Field label="Principal Name" k="principal_name" ph="Mr. / Mrs. Full Name"/>
          <Field label="Established Year" k="established_year" ph="1989"/>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📞 Contact Details</h2>
          <Field label="Phone Number" k="phone" ph="0300-0000000"/>
          <Field label="Email Address" k="email" ph="school@email.com"/>
          <Field label="Full Address" k="address" ph="Village, District, KPK" rows={3}/>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📊 School Statistics</h2>
          <p className="text-slate-400 text-xs">These numbers show on the homepage and about page</p>
          <Field label="Total Students" k="total_students" type="number"/>
          <Field label="Total Teachers" k="total_teachers" type="number"/>
        </div>

        {/* Mission & Vision */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>💬 Mission & Vision</h2>
          <Field label="Mission Statement" k="mission" rows={4}/>
          <Field label="Vision Statement" k="vision" rows={4}/>
        </div>

      </div>

      {/* Save button at bottom too */}
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  )
}
