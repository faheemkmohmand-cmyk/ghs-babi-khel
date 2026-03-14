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

  const displayName = profile?.full_name && profile.full_name.trim()
    ? profile.full_name
    : user.email?.split('@')[0] || 'User'

  const { data: exams } = await supabase.from('exams')
    .select('id,name,start_date,status').eq('status','upcoming')
    .order('start_date',{ascending:true}).limit(5)

  const { data: news } = await supabase.from('news')
    .select('id,title,category,date').eq('published',true)
    .order('date',{ascending:false}).limit(4)

  const { data: notices } = await supabase.from('notices')
    .select('id,title,type,date,important').eq('published',true)
    .order('date',{ascending:false}).limit(4)

  const { data: achievements } = await supabase.from('achievements')
    .select('id,title,category,year').order('year',{ascending:false}).limit(3)

  const { data: classResults } = await supabase.from('class_results')
    .select('id,class,exam_name,total_students,pass_students').eq('published',true)
    .order('created_at',{ascending:false}).limit(4)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName = dayNames[now.getDay()]

  const { data: todayTimetable } = await supabase.from('timetable')
    .select('*').eq('day', todayName).eq('section','A').order('class').order('period')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-lg">GHS</div>
            <span className="font-bold text-slate-800 text-sm">GHS Babi Khel</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">
              {displayName[0]?.toUpperCase()}
            </div>
            <LogoutButton/>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome */}
        <div className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#0a1628 0%,#014d26 100%)'}}>
          <div className="absolute right-6 top-6 text-8xl opacity-10 pointer-events-none">GHS</div>
          <p className="text-white/50 text-sm font-semibold mb-1">{greeting}</p>
          <h1 className="font-display text-2xl md:text-3xl font-black mb-1">{displayName}</h1>
          <p className="text-white/40 text-sm">GHS Babi Khel School Portal · {todayName}</p>
        </div>

        {/* Quick Links - ALL PUBLIC */}
        <div>
          <h2 className="font-display text-lg font-black text-slate-800 mb-3">School Portal</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[
              { icon:'📊', label:'Results',      href:'/results',      bg:'bg-green-50 border-green-200 text-green-700'   },
              { icon:'📅', label:'Timetable',    href:'/timetable',    bg:'bg-purple-50 border-purple-200 text-purple-700'},
              { icon:'✅', label:'Attendance',   href:'/attendance',   bg:'bg-blue-50 border-blue-200 text-blue-700'      },
              { icon:'📚', label:'Library',      href:'/library',      bg:'bg-rose-50 border-rose-200 text-rose-700'      },
              { icon:'📰', label:'News',         href:'/news',         bg:'bg-sky-50 border-sky-200 text-sky-700'         },
              { icon:'🏆', label:'Achievements', href:'/achievements', bg:'bg-amber-50 border-amber-200 text-amber-700'   },
              { icon:'🖼️', label:'Gallery',      href:'/gallery',      bg:'bg-pink-50 border-pink-200 text-pink-700'      },
              { icon:'👨‍🏫', label:'Teachers',    href:'/teachers',     bg:'bg-orange-50 border-orange-200 text-orange-700'},
              { icon:'ℹ️', label:'About',         href:'/about',        bg:'bg-slate-50 border-slate-200 text-slate-700'   },
              { icon:'🏠', label:'Home',          href:'/',             bg:'bg-slate-50 border-slate-200 text-slate-700'   },
            ].map(q => (
              <Link key={q.href} href={q.href}
                className={`${q.bg} border-2 rounded-2xl p-3 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
                <div className="text-xl mb-1">{q.icon}</div>
                <div className="font-black text-xs">{q.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Today Timetable */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-800">Today - {todayName}</h2>
              <Link href="/timetable" className="text-green-700 text-xs font-bold hover:underline">All</Link>
            </div>
            {todayTimetable && todayTimetable.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {todayTimetable.slice(0,6).map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-black text-slate-400 w-8">P{p.period}</span>
                    <span className="text-xs font-bold text-slate-700 flex-1">{p.subject}</span>
                    <span className="text-xs text-slate-400">Cls {p.class}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">
                  {now.getDay() === 0 ? 'Sunday - No school' : 'No timetable set'}
                </p>
                <Link href="/timetable" className="text-green-700 text-xs font-bold mt-1 block hover:underline">View Timetable</Link>
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-800">Notices</h2>
              <Link href="/notices" className="text-green-700 text-xs font-bold hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {notices && notices.length > 0 ? notices.map(n => (
                <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white flex-shrink-0 ${
                    n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':'bg-amber-500'
                  }`}>{n.type?.slice(0,3).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-400">{n.date}</p>
                  </div>
                </div>
              )) : (
                <p className="text-slate-400 text-sm text-center py-4">No notices yet</p>
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-black text-slate-800 mb-3">Upcoming Exams</h2>
            <div className="space-y-2">
              {exams && exams.length > 0 ? exams.map(ex => {
                const days = Math.ceil((new Date(ex.start_date).getTime()-now.getTime())/(1000*60*60*24))
                return (
                  <div key={ex.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${
                      days<=7?'bg-red-50 text-red-600':days<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'
                    }`}>{days>0?`${days}d`:'Today'}</span>
                  </div>
                )
              }) : (
                <p className="text-slate-400 text-sm text-center py-4">No upcoming exams</p>
              )}
            </div>
          </div>

          {/* Latest News */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-800">Latest News</h2>
              <Link href="/news" className="text-green-700 text-xs font-bold hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {news && news.length > 0 ? news.map(n => (
                <div key={n.id} className="p-2 rounded-lg bg-slate-50">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.category} · {n.date}</p>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No news yet</p>
                  <Link href="/news" className="text-green-700 text-xs font-bold mt-1 block hover:underline">Visit News</Link>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-800">Results</h2>
              <Link href="/results" className="text-green-700 text-xs font-bold hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {classResults && classResults.length > 0 ? classResults.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Class {r.class}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{r.exam_name}</p>
                  </div>
                  <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-1 rounded-full">
                    {r.total_students > 0 ? Math.round(r.pass_students/r.total_students*100)+'%' : 'N/A'}
                  </span>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No results yet</p>
                  <Link href="/results" className="text-green-700 text-xs font-bold mt-1 block hover:underline">Visit Results</Link>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-800">Achievements</h2>
              <Link href="/achievements" className="text-green-700 text-xs font-bold hover:underline">All</Link>
            </div>
            <div className="space-y-2">
              {achievements && achievements.length > 0 ? achievements.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50">
                  <span className="text-lg">🏆</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.category} · {a.year}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No achievements yet</p>
                  <Link href="/achievements" className="text-green-700 text-xs font-bold mt-1 block hover:underline">Visit Achievements</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
