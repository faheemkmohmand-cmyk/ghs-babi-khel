import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: notices } = await supabase
    .from('notices').select('id,title,type,date,important')
    .eq('published',true).order('date',{ascending:false}).limit(4)

  const { data: exams } = await supabase
    .from('exams').select('id,name,start_date,status')
    .eq('status','upcoming').order('start_date',{ascending:true}).limit(3)

  const { data: student } = await supabase
    .from('students').select('*')
    .eq('user_id', user.id).maybeSingle()

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-navy-800 text-sm">GHS Babi Khel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-green-950 rounded-3xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 text-9xl flex items-center justify-center pointer-events-none">🎓</div>
          <div className="relative z-10">
            <p className="text-white/50 text-sm font-semibold mb-1">{greeting} 👋</p>
            <h1 className="font-display text-2xl md:text-3xl font-black mb-2">{profile?.full_name || 'Student'}</h1>
            <p className="text-white/50 text-sm">
              {student ? `Class ${student.class}${student.section} · Roll No. ${student.roll_no}` : 'GHS Babi Khel Student Portal'}
            </p>
            {!student && (
              <p className="text-amber-300 text-sm mt-3 bg-amber-900/30 border border-amber-500/25 rounded-xl px-4 py-2 inline-block">
                ⚠️ Your student profile is being set up by admin. Check back soon.
              </p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon:'📊', label:'My Results',    href:'/dashboard/results',    bg:'bg-green-50',   text:'text-green-700',   border:'border-green-100' },
            { icon:'✅', label:'Attendance',    href:'/dashboard/attendance', bg:'bg-sky-50',     text:'text-sky-700',     border:'border-sky-100'   },
            { icon:'📅', label:'Timetable',     href:'/timetable',            bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-100'},
            { icon:'📚', label:'Library',       href:'/library',              bg:'bg-rose-50',    text:'text-rose-700',    border:'border-rose-100'  },
          ].map(q=>(
            <Link key={q.href} href={q.href}
              className={`${q.bg} ${q.border} border-2 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
              <div className="text-2xl mb-2">{q.icon}</div>
              <div className={`font-bold text-sm ${q.text}`}>{q.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Notices */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-navy-800">📢 Latest Notices</h2>
              <Link href="/notices" className="text-green-900 text-sm font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-3">
              {notices?.length ? notices.map(n=>(
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg text-white flex-shrink-0 ${
                    n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'
                  }`}>{n.type.slice(0,3).toUpperCase()}</span>
                  <div>
                    <p className="text-sm font-semibold text-navy-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.date}</p>
                  </div>
                  {n.important && <span className="text-red-500 text-xs ml-auto">🔴</span>}
                </div>
              )) : (
                <p className="text-slate-400 text-sm text-center py-4">No notices yet</p>
              )}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-navy-800">📝 Upcoming Exams</h2>
            </div>
            <div className="space-y-3">
              {exams?.length ? exams.map(ex=>{
                const days = Math.ceil((new Date(ex.start_date).getTime()-now.getTime())/(1000*60*60*24))
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-navy-800">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${
                      days<=7?'bg-red-50 text-red-600 border border-red-100':
                      days<=30?'bg-amber-50 text-amber-600 border border-amber-100':
                      'bg-green-50 text-green-700 border border-green-100'
                    }`}>{days>0?`${days}d left`:'Today!'}</span>
                  </div>
                )
              }) : (
                <p className="text-slate-400 text-sm text-center py-4">No upcoming exams</p>
              )}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-green-900 text-xs font-bold uppercase tracking-widest mb-1">School Links</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[['🏠 Home','/'],['📰 News','/news'],['🏆 Achievements','/achievements']].map(([l,h])=>(
                  <Link key={h} href={h} className="text-green-700 text-xs font-bold bg-white border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-900 hover:text-white hover:border-green-900 transition-all">{l}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit"
        className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
        Sign Out
      </button>
    </form>
  )
}
