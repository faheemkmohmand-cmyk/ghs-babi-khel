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
  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || 'User'

  const [
    { data: notices },
    { data: news },
    { data: exams },
    { data: achievements },
    { data: classResults },
    { data: teachers },
  ] = await Promise.all([
    supabase.from('notices').select('id,title,type,date,important').eq('published',true).order('date',{ascending:false}).limit(4),
    supabase.from('news').select('id,title,category,date').eq('published',true).order('date',{ascending:false}).limit(4),
    supabase.from('exams').select('id,name,start_date,status').eq('status','upcoming').order('start_date',{ascending:true}).limit(4),
    supabase.from('achievements').select('id,title,category,year').order('year',{ascending:false}).limit(3),
    supabase.from('class_results').select('id,class,exam_name,pass_students,total_students').eq('published',true).order('created_at',{ascending:false}).limit(4),
    supabase.from('teachers').select('id,full_name,subject,photo_url').eq('status','active').order('full_name').limit(4),
  ])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[now.getDay()]

  const { data: timetable } = await supabase.from('timetable')
    .select('*').eq('day', today).eq('section','A').order('class').order('period')

  const LINKS = [
    { icon:'📊', label:'Results',       href:'/results',       color:'green'  },
    { icon:'📅', label:'Timetable',     href:'/timetable',     color:'purple' },
    { icon:'📚', label:'Library',       href:'/library',       color:'rose'   },
    { icon:'📰', label:'News',          href:'/news',          color:'sky'    },
    { icon:'🏆', label:'Achievements',  href:'/achievements',  color:'amber'  },
    { icon:'🖼️', label:'Gallery',       href:'/gallery',       color:'pink'   },
    { icon:'👨‍🏫', label:'Teachers',     href:'/teachers',      color:'orange' },
    { icon:'📢', label:'Notices',       href:'/notices',       color:'yellow' },
    { icon:'ℹ️',  label:'About',         href:'/about',         color:'slate'  },
    { icon:'🏠', label:'Home',          href:'/',              color:'slate'  },
  ]

  const colorMap: Record<string,string> = {
    green:'bg-green-50 border-green-200 text-green-700',
    purple:'bg-purple-50 border-purple-200 text-purple-700',
    rose:'bg-rose-50 border-rose-200 text-rose-700',
    sky:'bg-sky-50 border-sky-200 text-sky-700',
    amber:'bg-amber-50 border-amber-200 text-amber-700',
    pink:'bg-pink-50 border-pink-200 text-pink-700',
    orange:'bg-orange-50 border-orange-200 text-orange-700',
    yellow:'bg-yellow-50 border-yellow-200 text-yellow-700',
    slate:'bg-slate-50 border-slate-200 text-slate-600',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-green-900 to-green-500 flex items-center justify-center">{logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover"/> : <span className="text-white font-black text-xs">GHS</span>}</div>
            <span className="font-bold text-slate-800 text-sm hidden sm:block">GHS Babi Khel</span>
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

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden"
          style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
          <div className="absolute right-4 top-4 opacity-10 text-8xl font-black pointer-events-none">GHS</div>
          <p className="text-white/50 text-sm mb-1">{greeting} 👋</p>
          <h1 className="font-display text-2xl font-black mb-1">{displayName}</h1>
          <p className="text-white/40 text-sm">GHS Babi Khel · {today}</p>
        </div>

        {/* ALL FEATURE LINKS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-display font-black text-slate-800 mb-4">School Portal — All Features</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {LINKS.map(q => (
              <Link key={q.href} href={q.href}
                className={`${colorMap[q.color]} border-2 rounded-2xl p-3 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
                <div className="text-2xl mb-1">{q.icon}</div>
                <div className="font-black text-xs">{q.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

          {/* Notices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">📢 Notices</h3>
              <Link href="/notices" className="text-green-700 text-xs font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {notices?.length ? notices.map(n => (
                <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white shrink-0 ${n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'}`}>
                    {n.type?.slice(0,3).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-slate-400">{n.date}</p>
                  </div>
                  {n.important && <span className="ml-auto text-red-500 text-xs">🔴</span>}
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-4">No notices yet</p>}
            </div>
          </div>

          {/* News */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">📰 Latest News</h3>
              <Link href="/news" className="text-green-700 text-xs font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {news?.length ? news.map(n => (
                <div key={n.id} className="p-2.5 rounded-xl bg-slate-50">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.category} · {n.date}</p>
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-4">No news yet</p>}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-black text-slate-800 mb-3">📝 Upcoming Exams</h3>
            <div className="space-y-2">
              {exams?.length ? exams.map(ex => {
                const daysLeft = Math.ceil((new Date(ex.start_date).getTime()-now.getTime())/(1000*60*60*24))
                return (
                  <div key={ex.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ${daysLeft<=7?'bg-red-50 text-red-600':daysLeft<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>
                      {daysLeft>0?`${daysLeft}d`:'Today!'}
                    </span>
                  </div>
                )
              }) : <p className="text-slate-400 text-sm text-center py-4">No upcoming exams</p>}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">📊 Results</h3>
              <Link href="/results" className="text-green-700 text-xs font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {classResults?.length ? classResults.map(r => {
                const pct = r.total_students > 0 ? Math.round(r.pass_students/r.total_students*100) : 0
                return (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Class {r.class}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{r.exam_name}</p>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded-full shrink-0 ${pct>=75?'bg-green-50 text-green-700':pct>=50?'bg-amber-50 text-amber-600':'bg-red-50 text-red-600'}`}>
                      {pct}% Pass
                    </span>
                  </div>
                )
              }) : <p className="text-slate-400 text-sm text-center py-4">No results published yet</p>}
            </div>
          </div>

          {/* Today Timetable */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">📅 Today — {today}</h3>
              <Link href="/timetable" className="text-green-700 text-xs font-bold hover:underline">Full</Link>
            </div>
            {timetable?.length ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {timetable.slice(0,8).map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs font-black text-slate-400 w-16 shrink-0">Cls {p.class} P{p.period}</span>
                    <span className="text-xs font-bold text-slate-700 flex-1 line-clamp-1">{p.subject}</span>
                    {p.teacher_name && <span className="text-xs text-slate-400 shrink-0 hidden sm:block">{p.teacher_name.split(' ')[0]}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {now.getDay()===0?'Sunday — No school':'No timetable available'}
              </p>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">🏆 Achievements</h3>
              <Link href="/achievements" className="text-green-700 text-xs font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {achievements?.length ? achievements.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50">
                  <span className="text-lg shrink-0">🏆</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.category} · {a.year}</p>
                  </div>
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-4">No achievements yet</p>}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
