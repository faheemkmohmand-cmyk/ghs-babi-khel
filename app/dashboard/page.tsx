import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
        Sign Out
      </button>
    </form>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Get display name — use full_name, fallback to email username
  const displayName = profile?.full_name && profile.full_name.trim()
    ? profile.full_name
    : user.email?.split('@')[0] || 'Welcome'

  const { data: exams } = await supabase.from('exams').select('id,name,start_date,status')
    .eq('status','upcoming').order('start_date',{ascending:true}).limit(3)

  const { data: news } = await supabase.from('news').select('id,title,category,date')
    .eq('published',true).order('date',{ascending:false}).limit(3)

  const { data: achievements } = await supabase.from('achievements').select('id,title,category,year')
    .order('year',{ascending:false}).limit(4)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const todayDate = now.toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const QUICK_LINKS = [
    { icon:'📊', label:'Results',      href:'/results',      bg:'bg-green-50',   border:'border-green-200',  text:'text-green-700'   },
    { icon:'📅', label:'Timetable',    href:'/timetable',    bg:'bg-purple-50',  border:'border-purple-200', text:'text-purple-700'  },
    { icon:'✅', label:'Attendance',   href:'/attendance',   bg:'bg-blue-50',    border:'border-blue-200',   text:'text-blue-700'    },
    { icon:'📚', label:'Library',      href:'/library',      bg:'bg-rose-50',    border:'border-rose-200',   text:'text-rose-700'    },
    { icon:'🏆', label:'Achievements', href:'/achievements', bg:'bg-amber-50',   border:'border-amber-200',  text:'text-amber-700'   },
    { icon:'🖼️', label:'Gallery',      href:'/gallery',      bg:'bg-pink-50',    border:'border-pink-200',   text:'text-pink-700'    },
    { icon:'📰', label:'News',         href:'/news',         bg:'bg-sky-50',     border:'border-sky-200',    text:'text-sky-700'     },
    { icon:'👨‍🏫', label:'Teachers',    href:'/teachers',     bg:'bg-orange-50',  border:'border-orange-200', text:'text-orange-700'  },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-slate-800 text-sm">GHS Babi Khel</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">
              {displayName[0]?.toUpperCase() || 'U'}
            </div>
            <LogoutButton/>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#0a1628 0%,#014d26 100%)'}}>
          <div className="absolute right-6 top-6 text-8xl opacity-10 pointer-events-none select-none">🏫</div>
          <div className="relative z-10">
            <p className="text-white/50 text-sm font-semibold mb-1">{greeting} 👋</p>
            <h1 className="font-display text-2xl md:text-3xl font-black mb-2">{displayName}</h1>
            <p className="text-white/40 text-sm">{todayDate} · GHS Babi Khel School Portal</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">🏠 Home</Link>
              <Link href="/timetable" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">📅 Timetable</Link>
              <Link href="/results" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">📊 Results</Link>
              <Link href="/attendance" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">✅ Attendance</Link>
            </div>
          </div>
        </div>

        {/* Quick Links Grid */}
        <div>
          <h2 className="font-display text-lg font-black text-slate-800 mb-3">🏫 School Portal</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(q => (
              <Link key={q.href} href={q.href}
                className={`${q.bg} ${q.border} border-2 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
                <div className="text-2xl mb-2">{q.icon}</div>
                <div className={`font-black text-sm ${q.text}`}>{q.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Latest News */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">📰 Latest News</h2>
              <Link href="/news" className="text-green-900 text-sm font-bold hover:underline">All →</Link>
            </div>
            <div className="space-y-3">
              {news?.length ? news.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">{n.category}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.date}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No news yet</p>
                  <Link href="/news" className="text-green-700 text-xs font-bold hover:underline mt-1 block">Visit News Page</Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">📝 Upcoming Exams</h2>
            </div>
            <div className="space-y-3">
              {exams?.length ? exams.map(ex => {
                const days = Math.ceil((new Date(ex.start_date).getTime() - now.getTime()) / (1000*60*60*24))
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full border flex-shrink-0 ${
                      days<=7  ? 'bg-red-50 text-red-600 border-red-100' :
                      days<=30 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                 'bg-green-50 text-green-700 border-green-100'
                    }`}>{days > 0 ? `${days}d left` : 'Today!'}</span>
                  </div>
                )
              }) : (
                <p className="text-slate-400 text-sm text-center py-6">No upcoming exams</p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">🏆 Achievements</h2>
              <Link href="/achievements" className="text-green-900 text-sm font-bold hover:underline">All →</Link>
            </div>
            <div className="space-y-3">
              {achievements?.length ? achievements.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-xl">🏆</span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.category} · {a.year}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm">No achievements yet</p>
                  <Link href="/achievements" className="text-green-700 text-xs font-bold hover:underline mt-1 block">Visit Achievements</Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick access to all school pages */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-black text-slate-800 mb-4">🔗 All School Pages</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['📊 Results',      '/results'],
                ['📅 Timetable',    '/timetable'],
                ['✅ Attendance',   '/attendance'],
                ['📚 Library',      '/library'],
                ['🖼️ Gallery',      '/gallery'],
                ['📰 News',         '/news'],
                ['🏆 Achievements', '/achievements'],
                ['👨‍🏫 Teachers',    '/teachers'],
                ['ℹ️ About',        '/about'],
                ['🏠 Home',         '/'],
              ].map(([label, href]) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-green-50 hover:text-green-800 text-slate-600 text-sm font-semibold transition-all border border-slate-100 hover:border-green-200">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
