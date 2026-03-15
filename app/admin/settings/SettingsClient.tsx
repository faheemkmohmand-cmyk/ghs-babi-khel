'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

// ← outside component — never re-creates on render

type Settings = {
  id: string
  school_name: string
  short_name: string
  principal_name: string
  established_year: string
  total_classes: number
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
  principal_photo_url: string
}

const DEFAULTS: Settings = {
  id: '', school_name: 'Government High School Babi Khel', short_name: 'GHS Babi Khel',
  principal_name: '', established_year: '1989', total_classes: 12,
  phone: '', email: '', address: 'Babi Khel, Khyber Pakhtunkhwa, Pakistan',
  logo_url: '', banner_url: '', banner_text: '',
  total_students: 450, total_teachers: 18,
  mission: 'To provide quality education with Islamic values.',
  vision: 'A school where every student reaches their full potential.',
  principal_photo_url: '',
}

export default function SettingsClient({ initialSettings }: { initialSettings: Settings | null }) {
  const [form, setForm]                     = useState<Settings>(initialSettings || DEFAULTS)
  const [saving, setSaving]                 = useState(false)
  const [logoUploading, setLogoUploading]   = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const logoRef   = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  function set(k: keyof Settings, v: any) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const supabase = createClient()

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ghs_uploads')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      if (!res.ok) return null
      return (await res.json()).secure_url
    } catch { return null }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setLogoUploading(true)
    const url = await uploadImage(file)
    if (url) { set('logo_url', url); toast.success('Logo uploaded ✅') }
    else toast.error('Logo upload failed')
    setLogoUploading(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setBannerUploading(true)
    const url = await uploadImage(file)
    if (url) { set('banner_url', url); toast.success('Banner uploaded ✅') }
    else toast.error('Banner upload failed')
    setBannerUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (form.id) {
        // Always UPDATE the existing row — never insert
        const { error } = await (supabase as any)
          .from('school_settings')
          .update(payload)
          .eq('id', form.id)
        if (error) { toast.error(error.message); return }
      } else {
        // No row exists yet — insert once, then save the id so future saves update
        const { data, error } = await (supabase as any)
          .from('school_settings')
          .insert({ ...payload } as any)
          .select()
          .single()
        if (error) { toast.error(error.message); return }
        if (data) setForm(data) // now form.id is set — all future saves will UPDATE
      }
      toast.success('All settings saved ✅ — Website updated!')
    } finally { setSaving(false) }
  }

  const inp = "w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"
  const lbl = "block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5"

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>⚙️ School Settings</h1>
          <p className="text-slate-500 text-sm">Changes here update the live website immediately</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save All Settings'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Logo */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🖼️ School Logo</h2>
          <p className="text-slate-400 text-xs">Appears in the navbar and header across the website</p>
          <div className="flex items-center gap-4 flex-wrap">
            {form.logo_url
              ? <img src={form.logo_url} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow"/>
              : <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl border-2 border-dashed border-slate-200">🏫</div>}
            <div className="flex-1 space-y-2">
              <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${logoUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                {logoUploading ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>Uploading...</> : '📤 Upload Logo'}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={handleLogoUpload}/>
              </label>
              {form.logo_url && <button onClick={() => set('logo_url', '')} className="block text-red-400 hover:text-red-600 text-xs font-bold">🗑️ Remove logo</button>}
              <p className="text-slate-400 text-xs">Recommended: square image, PNG or JPG</p>
            </div>
          </div>
          {form.logo_url && (
            <div>
              <label className={lbl}>Or paste image URL directly</label>
              <input type="text" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." className={inp}/>
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🖼️ Hero Banner Image</h2>
          <p className="text-slate-400 text-xs">Background image of the homepage hero section</p>
          <div className="flex items-center gap-4 flex-wrap">
            {form.banner_url
              ? <img src={form.banner_url} alt="Banner" className="w-32 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow"/>
              : <div className="w-32 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl border-2 border-dashed border-slate-200">🌄</div>}
            <div className="flex-1 space-y-2">
              <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all ${bannerUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                {bannerUploading ? <><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/>Uploading...</> : '📤 Upload Banner'}
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" disabled={bannerUploading} onChange={handleBannerUpload}/>
              </label>
              {form.banner_url && <button onClick={() => set('banner_url', '')} className="block text-red-400 hover:text-red-600 text-xs font-bold">🗑️ Remove banner</button>}
              <p className="text-slate-400 text-xs">Recommended: 1920×600px</p>
            </div>
          </div>
          <div>
            <label className={lbl}>Homepage Announcement Text</label>
            <textarea value={form.banner_text} onChange={e => set('banner_text', e.target.value)}
              placeholder="e.g. Admissions open for 2026 — Contact school office" rows={2}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
            <p className="text-slate-400 text-xs mt-1">Shows as an announcement bar on the homepage</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>🏫 Basic Information</h2>
          <div>
            <label className={lbl}>School Full Name</label>
            <input value={form.school_name} onChange={e => set('school_name', e.target.value)} placeholder="Government High School Babi Khel" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Short Name</label>
            <input value={form.short_name} onChange={e => set('short_name', e.target.value)} placeholder="GHS Babi Khel" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Principal Name</label>
            <input value={form.principal_name} onChange={e => set('principal_name', e.target.value)} placeholder="Mr. / Mrs. Full Name" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Established Year</label>
            <input value={form.established_year} onChange={e => set('established_year', e.target.value)} placeholder="1989" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Principal Photo</label>
            <div className="flex items-center gap-4 flex-wrap">
              {form.principal_photo_url
                ? <img src={form.principal_photo_url} alt="Principal" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow"/>
                : <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl border-2 border-dashed border-slate-200">👨‍💼</div>}
              <div className="flex-1 space-y-2">
                <label className="cursor-pointer inline-flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-sm bg-slate-800 hover:bg-slate-900 text-white transition-all">
                  📤 Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files?.[0]; if (!file) return
                    const url = await uploadImage(file)
                    if (url) set('principal_photo_url', url)
                    else toast.error('Upload failed')
                  }}/>
                </label>
                {form.principal_photo_url && (
                  <button onClick={() => set('principal_photo_url', '')} className="block text-red-400 hover:text-red-600 text-xs font-bold">🗑️ Remove photo</button>
                )}
              </div>
            </div>
            {form.principal_photo_url && (
              <div className="mt-2">
                <label className={lbl}>Or paste photo URL</label>
                <input type="text" value={form.principal_photo_url} onChange={e => set('principal_photo_url', e.target.value)} placeholder="https://..." className={inp}/>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📞 Contact Details</h2>
          <div>
            <label className={lbl}>Phone Number</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0300-0000000" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Email Address</label>
            <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="school@email.com" className={inp}/>
          </div>
          <div>
            <label className={lbl}>Full Address</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Village, District, KPK" rows={3}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
          </div>
        </div>

        {/* School Statistics */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>📊 School Statistics</h2>
          <p className="text-slate-400 text-xs">These numbers show on the homepage and about page</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>🎓 Total Students</label>
              <input type="number" value={form.total_students} onChange={e => set('total_students', Number(e.target.value))} className={inp}/>
            </div>
            <div>
              <label className={lbl}>👨‍🏫 Qualified Teachers</label>
              <input type="number" value={form.total_teachers} onChange={e => set('total_teachers', Number(e.target.value))} className={inp}/>
            </div>
            <div>
              <label className={lbl}>📚 Classes Running</label>
              <input type="number" value={form.total_classes} onChange={e => set('total_classes', Number(e.target.value))} className={inp}/>
            </div>
            <div>
              <label className={lbl}>🏆 Years of Excellence</label>
              <input type="number" value={new Date().getFullYear() - Number(form.established_year || 1989)}
                readOnly className={inp + " bg-slate-50 cursor-default text-slate-400"}/>
              <p className="text-slate-400 text-xs mt-1">Auto-calculated from Established Year</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-black text-slate-800 text-base" style={{fontFamily:'Georgia,serif'}}>💬 Mission & Vision</h2>
          <div>
            <label className={lbl}>Mission Statement</label>
            <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={4}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
          </div>
          <div>
            <label className={lbl}>Vision Statement</label>
            <textarea value={form.vision} onChange={e => set('vision', e.target.value)} rows={4}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
          </div>
        </div>

      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md">
          {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  )
}
