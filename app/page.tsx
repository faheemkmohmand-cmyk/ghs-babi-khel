import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  let settings: any = null
  let notices: any[] = []

  try {
    const supabase = createClient()
    const { data: s } = await supabase.from('school_settings').select('*').limit(1).maybeSingle() as any
    settings = s
    const { data: n } = await supabase.from('notices').select('id,title,type,date,important')
      .eq('published', true).order('date', { ascending: false }).limit(5)
    notices = n || []
  } catch (_) {}

  const schoolName    = settings?.school_name    || 'Government High School Babi Khel'
  const principal     = settings?.principal_name || ''
  const totalStudents = settings?.total_students || 450
  const totalTeachers = settings?.total_teachers || 18
  const totalClasses  = settings?.total_classes  || 12
  const estYear       = Number(settings?.established_year || 1989)
  const yearsOfExc    = new Date().getFullYear() - estYear

  const typeColors: Record<string,string> = {
    exam:'bg-red-500', holiday:'bg-sky-500', event:'bg-green-600', general:'bg-amber-500',
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Announcement Banner */}
      {settings?.banner_text && (
        <div className="bg-green-900 text-white text-center text-sm font-semibold py-2 px-4 relative z-50">
          📢 {settings.banner_text}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            {settings?.logo_url
              ? <img src={settings.logo_url} alt="Logo" className="w-9 h-9 rounded-full object-cover shadow-lg"/>
              : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-lg shadow-lg">🏫</div>}
            <div>
              <div className="font-display font-bold text-white text-sm leading-none">{settings?.short_name || 'GHS Babi Khel'}</div>
              <div className="text-green-400 text-xs font-semibold">Khyber Pakhtunkhwa</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[['About','/about'],['Teachers','/teachers'],['Notices','/notices'],['Results','/results'],['Gallery','/gallery'],['Library','/library'],['News','/news']].map(([label,href]) => (
              <Link key={href} href={href} className="text-white/60 hover:text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-white/8 transition-all">{label}</Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="text-white/60 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 transition-all">Login</Link>
            <Link href="/signup" className="bg-green-900 hover:bg-green-950 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{background: settings?.banner_url
          ? `linear-gradient(135deg,rgba(2,8,16,0.85),rgba(10,22,40,0.80),rgba(1,77,38,0.75)), url(${settings.banner_url}) center/cover no-repeat`
          : 'linear-gradient(135deg,#020810 0%,#0a1628 45%,#014d26 100%)'}}>

        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{backgroundImage:'linear-gradient(rgba(74,222,128,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.05) 1px,transparent 1px)',backgroundSize:'60px 60px'}}/>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-900/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-700/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-green-900/30 border border-green-400/25 text-green-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                🏫 Est. {settings?.established_year || '1989'} · KPK, Pakistan
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
                {schoolName.split(' ').slice(0,2).join(' ')}<br/>
                <span className="text-green-400">{schoolName.split(' ').slice(2).join(' ')}</span>
              </h1>
              <p className="text-white/55 text-lg leading-relaxed mb-8 max-w-lg">
                {settings?.mission || 'Providing quality education with Islamic values — developing responsible citizens who contribute to Pakistan.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="bg-green-900 hover:bg-green-950 text-white font-bold px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all">
                  🎓 Student Portal →
                </Link>
                <Link href="/notices" className="bg-white/8 hover:bg-white/14 border border-white/15 text-white font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all">
                  📢 Latest Notices
                </Link>
              </div>
              <div className="mt-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black px-8 py-3.5 rounded-2xl text-sm shadow-lg hover:-translate-y-0.5 transition-all">
                  🚀 Go to Dashboard
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-up" style={{animationDelay:'0.15s'}}>
              {[
                {num:`${totalStudents}+`, label:'Students Enrolled',   icon:'🎓', color:'from-green-950/80 to-green-900/40',  border:'border-green-400/20'},
                {num:`${totalTeachers}+`, label:'Qualified Teachers',  icon:'👨‍🏫', color:'from-sky-950/80 to-sky-900/40',     border:'border-sky-400/20'},
                {num:`${totalClasses}+`,  label:'Classes Running',     icon:'📚', color:'from-purple-950/80 to-purple-900/40',border:'border-purple-400/20'},
                {num:`${yearsOfExc}+`,    label:'Years of Excellence', icon:'🏆', color:'from-amber-950/80 to-amber-900/40',  border:'border-amber-400/20'},
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-3xl p-5 backdrop-blur-sm`}>
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-display text-3xl font-black text-white">{s.num}</div>
                  <div className="text-white/45 text-xs font-semibold mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,0 1080,80 1440,40 L1440,60 L0,60 Z" fill="#f1f5f9"/>
          </svg>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-black text-navy-800 mb-2">School Portal</h2>
          <p className="text-slate-500">Everything students and parents need in one place</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {icon:'📊', label:'Results',      href:'/results',      bg:'bg-green-50',  border:'border-green-100',  text:'text-green-700'},
            {icon:'📅', label:'Timetable',    href:'/timetable',    bg:'bg-sky-50',    border:'border-sky-100',    text:'text-sky-700'},
            {icon:'🖼️', label:'Gallery',      href:'/gallery',      bg:'bg-purple-50', border:'border-purple-100', text:'text-purple-700'},
            {icon:'📢', label:'Notices',      href:'/notices',      bg:'bg-amber-50',  border:'border-amber-100',  text:'text-amber-700'},
            {icon:'📚', label:'Library',      href:'/library',      bg:'bg-rose-50',   border:'border-rose-100',   text:'text-rose-700'},
            {icon:'🏆', label:'Achievements', href:'/achievements', bg:'bg-indigo-50', border:'border-indigo-100', text:'text-indigo-700'},
          ].map(q => (
            <Link key={q.href} href={q.href}
              className={`${q.bg} ${q.border} border-2 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-lg transition-all`}>
              <div className="text-3xl mb-2">{q.icon}</div>
              <div className={`font-bold text-sm ${q.text}`}>{q.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST NOTICES */}
      {notices.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-black text-navy-800">Latest Notices</h2>
                <p className="text-slate-500 mt-1">Important announcements from school administration</p>
              </div>
              <Link href="/notices" className="text-green-900 font-bold text-sm hover:underline">View All →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notices.map(n => (
                <div key={n.id} className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <span className={`${typeColors[n.type]||'bg-slate-400'} text-white text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0`}>
                      {(n.type||'').toUpperCase()}
                    </span>
                    {n.important && <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg border border-red-100">🔴 Important</span>}
                  </div>
                  <h3 className="font-bold text-navy-800 mt-3 leading-snug">{n.title}</h3>
                  <p className="text-slate-400 text-xs mt-2">{n.date}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* PRINCIPAL MESSAGE */}
      {principal && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row gap-8 items-center">
            {settings?.principal_photo_url
              ? <img src={settings.principal_photo_url} alt={principal} className="w-24 h-24 rounded-full object-cover flex-shrink-0 shadow-lg border-4 border-white/20"/>
              : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-4xl flex-shrink-0 shadow-lg">👨‍💼</div>}
            <div>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">Message from the Principal</div>
              <h2 className="font-display text-2xl font-black mb-3">{principal}</h2>
              <p className="text-white/60 leading-relaxed">{settings?.vision || 'Our school is committed to academic excellence and character building. Every student deserves quality education and we strive to provide the best learning environment.'}</p>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-navy-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {settings?.logo_url
                  ? <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover"/>
                  : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-xl">🏫</div>}
                <div>
                  <div className="font-display font-bold text-white">{settings?.short_name || 'GHS Babi Khel'}</div>
                  <div className="text-white/40 text-xs">Khyber Pakhtunkhwa, Pakistan</div>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">{settings?.address || 'Babi Khel, KPK, Pakistan'}</p>
              {settings?.phone && <p className="text-white/40 text-sm mt-1">📞 {settings.phone}</p>}
              {settings?.email && <p className="text-white/40 text-sm mt-1">📧 {settings.email}</p>}
            </div>
            <div>
              <h4 className="font-bold text-sm text-white/60 uppercase tracking-widest mb-4">Quick Links</h4>
              <div className="space-y-2">
                {[['About School','/about'],['Our Teachers','/teachers'],['Notice Board','/notices'],['Gallery','/gallery'],['Results','/results']].map(([l,h])=>(
                  <Link key={h} href={h} className="block text-white/50 hover:text-white text-sm transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-white/60 uppercase tracking-widest mb-4">School Portal</h4>
              <div className="space-y-2">
                {[['Login','/login'],['Sign Up','/signup'],['Results','/results'],['Timetable','/timetable'],['Gallery','/gallery'],['Achievements','/achievements']].map(([l,h])=>(
                  <Link key={h} href={h} className="block text-white/50 hover:text-white text-sm transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/8 pt-6 text-center text-white/30 text-xs">
            © {new Date().getFullYear()} {settings?.school_name || 'Government High School Babi Khel'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
