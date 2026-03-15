import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AboutPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from('school_settings').select('*').limit(1).maybeSingle() as any
  const { data: teachers } = await supabase.from('teachers').select('full_name,subject,role,photo_url,qualification').eq('status','active').order('full_name').limit(8)
  const { data: achievements } = await supabase.from('achievements').select('*').eq('featured',true).limit(4)

  const s = settings || {
    school_name:'Government High School Babi Khel', principal_name:'',
    established_year:'1989', phone:'', email:'', address:'Babi Khel, Khyber Pakhtunkhwa',
    total_students:450, total_teachers:18,
    mission:'To provide quality education with Islamic values and modern knowledge.',
    vision:'A school where every student reaches their full potential and becomes a responsible citizen.'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ About</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      {/* Hero */}
      <div className="text-white py-16 px-4 text-center relative overflow-hidden" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',backgroundSize:'32px 32px'}} />
        <div className="relative max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <h1 className="text-3xl md:text-4xl font-black mb-3" style={{fontFamily:'Georgia,serif'}}>{s.school_name}</h1>
          <p className="text-white/50 text-sm mb-6">Established {s.established_year} · {s.address}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[{n:s.total_students,l:'Students'},{n:s.total_teachers,l:'Teachers'},{n:new Date().getFullYear()-Number(s.established_year||1989),l:'Years'},{n:'100%',l:'Dedication'}].map(stat=>(
              <div key={stat.l} className="bg-white/10 rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-black">{stat.n}</div>
                <div className="text-white/50 text-xs mt-0.5">{stat.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🎯</div>
            <h2 className="font-black text-slate-800 text-lg mb-3" style={{fontFamily:'Georgia,serif'}}>Our Mission</h2>
            <p className="text-slate-500 leading-relaxed">{s.mission}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-4" style={{background:'linear-gradient(135deg,#0a1628,#4ade80)'}}>🌟</div>
            <h2 className="font-black text-slate-800 text-lg mb-3" style={{fontFamily:'Georgia,serif'}}>Our Vision</h2>
            <p className="text-slate-500 leading-relaxed">{s.vision}</p>
          </div>
        </div>

        {/* Principal */}
        {s.principal_name && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-6 flex-wrap">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>
              {s.principal_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Principal</p>
              <h3 className="font-black text-slate-800 text-xl" style={{fontFamily:'Georgia,serif'}}>{s.principal_name}</h3>
              <p className="text-slate-500 text-sm">{s.school_name}</p>
            </div>
          </div>
        )}

        {/* Faculty */}
        {teachers && teachers.length > 0 && (
          <div>
            <h2 className="font-black text-slate-800 text-xl mb-4" style={{fontFamily:'Georgia,serif'}}>👨‍🏫 Our Faculty</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {teachers.map(t=>(
                <div key={t.full_name} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-md transition-all">
                  {t.photo_url
                    ? <img src={t.photo_url} className="w-14 h-14 rounded-full object-cover mx-auto mb-3" alt="" />
                    : <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg mx-auto mb-3" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>{t.full_name?.[0]}</div>
                  }
                  <p className="font-black text-slate-800 text-sm">{t.full_name}</p>
                  <p className="text-green-900 text-xs font-bold">{t.subject}</p>
                  {t.qualification && <p className="text-slate-400 text-xs">{t.qualification}</p>}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link href="/teachers" className="text-green-900 font-bold hover:underline text-sm">View all teachers →</Link>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="font-black text-slate-800 text-xl mb-4" style={{fontFamily:'Georgia,serif'}}>📞 Contact Us</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {icon:'📍',label:'Address',val:s.address},
              {icon:'📞',label:'Phone',val:s.phone||'Contact school office'},
              {icon:'📧',label:'Email',val:s.email||'Contact school office'},
            ].map(c=>(
              <div key={c.label} className="bg-slate-50 rounded-2xl p-4">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</div>
                <div className="text-slate-700 font-semibold text-sm">{c.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
