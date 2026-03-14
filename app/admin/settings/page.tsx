'use client'
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const supabase = createClient()

type Settings = {
  id: string
  school_name: string; short_name: string; principal_name: string
  established_year: string; phone: string; email: string; address: string
  total_students: number; total_teachers: number; total_classes: number; years_of_excellence: number
  mission: string; vision: string
  logo_url: string; banner_url: string; banner_title: string; banner_subtitle: string; show_banner: boolean
}

const DEF: Omit<Settings,'id'> = {
  school_name:'Government High School Babi Khel', short_name:'GHS Babi Khel',
  principal_name:'', established_year:'1989', phone:'', email:'',
  address:'Babi Khel, Khyber Pakhtunkhwa, Pakistan',
  total_students:450, total_teachers:18, total_classes:5, years_of_excellence:35,
  mission:'To provide quality education with Islamic values, developing responsible citizens.',
  vision:'A school where every student reaches their full potential.',
  logo_url:'', banner_url:'', banner_title:'Welcome to GHS Babi Khel',
  banner_subtitle:'Providing quality education since 1989', show_banner:false,
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Omit<Settings,'id'>>(DEF)
  const [settingsId, setSettingsId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('school_settings').select('*').single()
      if (data) {
        setSettingsId(data.id)
        setForm({
          school_name: data.school_name || DEF.school_name,
          short_name: data.short_name || DEF.short_name,
          principal_name: data.principal_name || '',
          established_year: data.established_year || '1989',
          phone: data.phone || '', email: data.email || '',
          address: data.address || DEF.address,
          total_students: data.total_students || 450,
          total_teachers: data.total_teachers || 18,
          total_classes: data.total_classes || 5,
          years_of_excellence: data.years_of_excellence || 35,
          mission: data.mission || DEF.mission,
          vision: data.vision || DEF.vision,
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          banner_title: data.banner_title || DEF.banner_title,
          banner_subtitle: data.banner_subtitle || DEF.banner_subtitle,
          show_banner: data.show_banner ?? false,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(key: keyof typeof DEF, val: any) {
    setForm(p => ({ ...p, [key]: val }))
  }

  async function uploadImage(file: File, type: 'logo' | 'banner') {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Max 10MB'); return }
    type === 'logo' ? setUploadingLogo(true) : setUploadingBanner(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `school/${type}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed: ' + error.message); type === 'logo' ? setUploadingLogo(false) : setUploadingBanner(false); return }
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)
    if (type === 'logo') { set('logo_url', publicUrl); setUploadingLogo(false); toast.success('Logo uploaded!') }
    else { set('banner_url', publicUrl); setUploadingBanner(false); toast.success('Banner uploaded!') }
  }

  async function save() {
    setSaving(true)
    try {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (settingsId) {
        const { error } = await supabase.from('school_settings').update(payload).eq('id', settingsId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('school_settings').insert(payload).select().single()
        if (error) throw error
        setSettingsId(data.id)
      }
      toast.success('Settings saved! Refresh homepage to see changes.')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <AdminLayout adminName=""><div className="text-center py-20 text-slate-400">Loading...</div></AdminLayout>

  return (
    <AdminLayout adminName="">
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">Settings</h1>
            <p className="text-slate-500 text-sm">Everything shown on your website — edit and save</p>
          </div>
          <button onClick={save} disabled={saving}
            className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── SECTION 1: SCHOOL LOGO ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-black">1</span>
            School Logo
          </h2>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
              {form.logo_url
                ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain"/>
                : <span className="text-slate-300 text-xs font-bold text-center">No Logo</span>}
            </div>
            <div className="flex-1">
              <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm ${uploadingLogo ? 'bg-slate-100 text-slate-400' : 'bg-green-900 hover:bg-green-950 text-white'}`}>
                {uploadingLogo ? 'Uploading...' : 'Upload Logo Photo'}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" disabled={uploadingLogo}
                  onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}/>
              </label>
              <p className="text-slate-400 text-xs mt-1.5">PNG or JPG, square shape recommended, max 10MB</p>
              {form.logo_url && (
                <button onClick={() => set('logo_url', '')} className="text-xs text-red-400 font-bold hover:text-red-600 mt-1 block">Remove logo</button>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SCHOOL BANNER ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-black">2</span>
              Homepage Banner Photo
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600">Show on website</span>
              <button onClick={() => set('show_banner', !form.show_banner)}
                className={`w-12 h-6 rounded-full transition-all relative ${form.show_banner ? 'bg-green-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.show_banner ? 'left-7' : 'left-1'}`}/>
              </button>
            </div>
          </div>

          {form.banner_url && (
            <div className="relative rounded-xl overflow-hidden mb-4 h-40">
              <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                <p className="font-black text-lg">{form.banner_title}</p>
                <p className="text-white/70 text-sm mt-1">{form.banner_subtitle}</p>
              </div>
              {!form.show_banner && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">Hidden</div>
              )}
            </div>
          )}

          <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm mb-4 ${uploadingBanner ? 'bg-slate-100 text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
            {uploadingBanner ? 'Uploading...' : 'Upload Banner Photo'}
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" disabled={uploadingBanner}
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')}/>
          </label>
          <p className="text-slate-400 text-xs mb-4">Upload your school building photo or any school photo. Best size: wide/landscape (1920x600px)</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Banner Heading</label>
              <input value={form.banner_title} onChange={e => set('banner_title', e.target.value)}
                placeholder="Welcome to GHS Babi Khel"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Banner Subheading</label>
              <input value={form.banner_subtitle} onChange={e => set('banner_subtitle', e.target.value)}
                placeholder="Providing quality education since 1989"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: STATS (shown on homepage) ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 text-base mb-1 flex items-center gap-2">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-black">3</span>
            Homepage Statistics
          </h2>
          <p className="text-slate-400 text-sm mb-4 ml-9">These 4 numbers show on the main page of your website</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label:'Students Enrolled', key:'total_students', icon:'🎓', desc:'Shows as "450+ Students"' },
              { label:'Qualified Teachers', key:'total_teachers', icon:'👨‍🏫', desc:'Shows as "18+ Teachers"' },
              { label:'Classes Running',   key:'total_classes',  icon:'🏫', desc:'Shows as "5 Classes"' },
              { label:'Years of Excellence', key:'years_of_excellence', icon:'🏆', desc:'Shows as "35+ Years"' },
            ].map(f => (
              <div key={f.key} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="text-2xl mb-2">{f.icon}</div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{f.label}</label>
                <input type="number" min="0"
                  value={(form as any)[f.key]}
                  onChange={e => set(f.key as any, parseInt(e.target.value) || 0)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black outline-none focus:border-green-400 text-center bg-white text-slate-800"/>
                <p className="text-slate-400 text-xs text-center mt-1.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 4: SCHOOL INFO ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-black">4</span>
            School Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full School Name</label>
              <input value={form.school_name} onChange={e => set('school_name', e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Short Name (shown in navbar)</label>
              <input value={form.short_name} onChange={e => set('short_name', e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Principal Name</label>
              <input value={form.principal_name} onChange={e => set('principal_name', e.target.value)}
                placeholder="Mr. / Ms. ..."
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Established Year</label>
              <input value={form.established_year} onChange={e => set('established_year', e.target.value)}
                placeholder="1989"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">School Mission (shown on homepage)</label>
            <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={2}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
          </div>
        </div>

        {/* ── SECTION 5: CONTACT ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm font-black">5</span>
            Contact Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone Number</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+92 xxx xxxxxxx"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="school@email.com"
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Address</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button onClick={save} disabled={saving}
          className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg">
          {saving && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>

      </div>
    </AdminLayout>
  )
}
