import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AboutPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from('school_settings').select('*').single()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ About</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="font-display text-3xl md:text-4xl font-black mb-3">
            {settings?.school_name || 'Government High School Babi Khel'}
          </h1>
          <p className="text-white/60 text-lg">Est. {settings?.established_year || '1989'} · Khyber Pakhtunkhwa, Pakistan</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="text-3xl mb-3">🎯</div>
            <h2 className="font-display text-xl font-black text-slate-800 mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">{settings?.mission || 'To provide quality education with Islamic values, developing responsible citizens who contribute positively to society and Pakistan.'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="text-3xl mb-3">🌟</div>
            <h2 className="font-display text-xl font-black text-slate-800 mb-3">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed">{settings?.vision || 'A school where every student reaches their full potential and becomes a productive member of society.'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-display text-xl font-black text-slate-800 mb-6">📊 School at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:'🎓', label:'Students', value:`${settings?.total_students || 450}+` },
              { icon:'👨‍🏫', label:'Teachers', value:`${settings?.total_teachers || 18}+` },
              { icon:'📅', label:'Est.', value:settings?.established_year || '1989' },
              { icon:'📚', label:'Classes', value:'6 – 10' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-slate-50 rounded-2xl">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-display text-2xl font-black text-slate-800">{s.value}</div>
                <div className="text-slate-500 text-xs font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {settings?.principal_name && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white text-3xl flex-shrink-0">👨‍💼</div>
            <div>
              <p className="text-green-800 text-xs font-bold uppercase tracking-widest mb-1">Principal</p>
              <h3 className="font-display text-xl font-black text-slate-800">{settings.principal_name}</h3>
              <p className="text-slate-500 text-sm mt-1">Government High School Babi Khel</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-display text-xl font-black text-slate-800 mb-4">📍 Contact & Location</h2>
          <div className="space-y-3 text-sm text-slate-600">
            {settings?.address && <p>🏫 <strong>Address:</strong> {settings.address}</p>}
            {settings?.phone && <p>📞 <strong>Phone:</strong> {settings.phone}</p>}
            {settings?.email && <p>✉️ <strong>Email:</strong> {settings.email}</p>}
            <p>🌍 <strong>Location:</strong> Babi Khel, Khyber Pakhtunkhwa, Pakistan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
