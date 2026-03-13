'use client'
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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
  const supabase = createClient()
  const [form, setForm] = useState(DEF)
  const [settingsId, setSettingsId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [tab, setTab] = useState<'general'|'banner'|'stats'|'contact'>('general')
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function init() {
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
    init()
  }, [])

  function set(key: keyof typeof DEF, val: any) {
    setForm(p => ({ ...p, [key]: val }))
  }

  async function uploadImage(file: File, type: 'logo' | 'banner') {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB'); return }

    type === 'logo' ? setUploadingLogo(true) : setUploadingBanner(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `school/${type}-${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('gallery').upload(path, file, { upsert: true })
    if (error) {
      toast.error('Upload failed: ' + error.message)
      type === 'logo' ? setUploadingLogo(false) : setUploadingBanner(false)
      return
    }

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
      toast.success('✅ Settings saved! Refresh website to see changes.')
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const TABS = [
    { key: 'general', label: '🏫 General' },
    { key: 'banner',  label: '🖼️ Logo & Banner' },
    { key: 'stats',   label: '📊 Stats' },
    { key: 'contact', label: '📞 Contact' },
  ] as const

  if (loading) return (
    <AdminLayout adminName=""><div className="text-center py-20 text-slate-400">Loading settings...</div></AdminLayout>
  )

  return (
    <AdminLayout adminName="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">⚙️ School Settings</h1>
            <p className="text-slate-500 text-sm">Control everything shown on your website</p>
          </div>
          <button onClick={save} disabled={saving}
            className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-bold transition-all ${tab === t.key ? 'bg-green-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* GENERAL TAB */}
        {tab === 'general' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-display font-black text-slate-800 text-lg mb-4">🏫 School Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full School Name</label>
                <input value={form.school_name} onChange={e => set('school_name', e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Short Name (shown in nav)</label>
                <input value={form.short_name} onChange={e => set('short_name', e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Principal Name</label>
                <input value={form.principal_name} onChange={e => set('principal_name', e.target.value)}
                  placeholder="Mr. / Ms. ..." className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Established Year</label>
                <input value={form.established_year} onChange={e => set('established_year', e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Mission Statement (shown on homepage)</label>
              <textarea value={form.mission} onChange={e => set('mission', e.target.value)} rows={3}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Vision Statement</label>
              <textarea value={form.vision} onChange={e => set('vision', e.target.value)} rows={2}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
            </div>
          </div>
        )}

        {/* BANNER TAB */}
        {tab === 'banner' && (
          <div className="space-y-5">
            {/* Logo */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-display font-black text-slate-800 text-lg mb-1">🏫 School Logo</h2>
              <p className="text-slate-400 text-sm mb-5">Upload your school logo. It will replace the 🏫 emoji everywhere on the website.</p>
              <div className="flex items-center gap-6 flex-wrap">
                {/* Preview */}
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {form.logo_url
                    ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain"/>
                    : <span className="text-4xl">🏫</span>
                  }
                </div>
                <div className="flex-1">
                  <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl text-sm transition-all ${
                    uploadingLogo ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-900 hover:bg-green-950 text-white'
                  }`}>
                    {uploadingLogo ? <>⏳ Uploading...</> : <>📤 Upload Logo</>}
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" disabled={uploadingLogo}
                      onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}/>
                  </label>
                  <p className="text-slate-400 text-xs mt-2">PNG or JPG · Max 5MB · Recommended: square image</p>
                  {form.logo_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <input value={form.logo_url} onChange={e => set('logo_url', e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 text-slate-400"/>
                      <button onClick={() => set('logo_url', '')} className="text-xs text-red-400 font-bold hover:text-red-600">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-black text-slate-800 text-lg">🖼️ Homepage Banner</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-bold text-slate-600">Show on website</span>
                  <div onClick={() => set('show_banner', !form.show_banner)}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${form.show_banner ? 'bg-green-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.show_banner ? 'left-7' : 'left-1'}`}/>
                  </div>
                </label>
              </div>
              <p className="text-slate-400 text-sm mb-5">Add a real school photo banner that appears at the top of your homepage — like other school websites.</p>

              {/* Banner preview */}
              {form.banner_url && (
                <div className="relative rounded-2xl overflow-hidden mb-5 h-48">
                  <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4">
                    <p className="font-black text-xl text-center">{form.banner_title}</p>
                    <p className="text-white/70 text-sm text-center mt-1">{form.banner_subtitle}</p>
                  </div>
                  {!form.show_banner && (
                    <div className="absolute top-2 right-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg">Hidden — toggle ON to show</div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-6 flex-wrap mb-5">
                <div className="flex-shrink-0">
                  <label className={`cursor-pointer inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl text-sm transition-all ${
                    uploadingBanner ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}>
                    {uploadingBanner ? <>⏳ Uploading...</> : <>📸 Upload Banner Photo</>}
                    <input ref={bannerRef} type="file" accept="image/*" className="hidden" disabled={uploadingBanner}
                      onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')}/>
                  </label>
                  <p className="text-slate-400 text-xs mt-2">Best size: 1920×600px landscape photo</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Banner Title (shown over photo)</label>
                  <input value={form.banner_title} onChange={e => set('banner_title', e.target.value)}
                    placeholder="Welcome to GHS Babi Khel"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Banner Subtitle</label>
                  <input value={form.banner_subtitle} onChange={e => set('banner_subtitle', e.target.value)}
                    placeholder="Providing quality education since 1989"
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
                </div>
              </div>

              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                💡 Upload your school building photo, annual day photo, or any school event photo as the banner.
              </div>
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-display font-black text-slate-800 text-lg mb-1">📊 School Statistics</h2>
            <p className="text-slate-400 text-sm mb-5">These numbers are displayed on your homepage and About page.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { label:'Total Students Enrolled', key:'total_students', icon:'🎓', hint:'e.g. 450' },
                { label:'Total Teachers', key:'total_teachers', icon:'👨‍🏫', hint:'e.g. 18' },
                { label:'Classes Running', key:'total_classes', icon:'🏫', hint:'e.g. 5 (Class 6-10)' },
                { label:'Years of Excellence', key:'years_of_excellence', icon:'🏆', hint:'e.g. 35' },
              ].map(f => (
                <div key={f.key} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {f.icon} {f.label}
                  </label>
                  <input
                    type="number"
                    value={(form as any)[f.key]}
                    onChange={e => set(f.key as any, parseInt(e.target.value) || 0)}
                    placeholder={f.hint}
                    className="w-full border-2 border-slate-200 rounded-xl px-3 py-3 text-2xl font-black outline-none focus:border-green-400 text-center text-slate-800 bg-white"/>
                  <p className="text-slate-400 text-xs text-center mt-2">{f.hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold">
              ✅ These stats show on your homepage hero section as: "450+ Students · 18 Teachers · 5 Classes · 35 Years"
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {tab === 'contact' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-display font-black text-slate-800 text-lg mb-4">📞 Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
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
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Address</label>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={3}
                className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
            </div>
          </div>
        )}

        {/* Save button at bottom */}
        <button onClick={save} disabled={saving}
          className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg flex items-center justify-center gap-2">
          {saving && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
          {saving ? 'Saving...' : '💾 Save All Changes'}
        </button>
      </div>
    </AdminLayout>
  )
}
