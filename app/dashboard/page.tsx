import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')

  const { data: notices } = await supabase.from('notices').select('id,title,type,date,important')
    .eq('published', true).order('date', { ascending: false }).limit(4)

  const { data: exams } = await supabase.from('exams').select('id,name,start_date,status')
    .eq('status', 'upcoming').order('start_date', { ascending: true }).limit(3)

  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()

  const { data: results } = await supabase.from('results').select('*')
    .eq('student_id', student?.id || '').order('created_at', { ascending: false }).limit(3)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-slate-800 text-sm">GHS Babi Khel</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 font-semibold hidden sm:block">🌐 Website</Link>
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
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

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon:'📊', label:'My Results',    href:'/dashboard/results',    bg:'bg-green-50',   text:'text-green-700',   border:'border-green-100' },
            { icon:'✅', label:'Attendance',    href:'/dashboard/attendance', bg:'bg-sky-50',     text:'text-sky-700',     border:'border-sky-100' },
            { icon:'📅', label:'Timetable',     href:'/timetable',            bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-100' },
            { icon:'📢', label:'Notices',       href:'/notices',              bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-100' },
          ].map(q => (
            <Link key={q.href} href={q.href}
              className={`${q.bg} ${q.border} border-2 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
              <div className="text-2xl mb-2">{q.icon}</div>
              <div className={`font-bold text-sm ${q.text}`}>{q.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Results */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">📊 Recent Results</h2>
              <Link href="/dashboard/results" className="text-green-800 text-sm font-bold hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {results?.length ? results.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.exam_name}</p>
                    <p className="text-xs text-slate-400">{r.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{r.percentage}%</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.result === 'Pass' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{r.result}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-slate-400 text-sm">No results yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Notices + Exams */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-black text-slate-800">📢 Notices</h2>
                <Link href="/notices" className="text-green-800 text-sm font-bold hover:underline">See All</Link>
              </div>
              <div className="space-y-2">
                {notices?.length ? notices.map(n => (
                  <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg text-white flex-shrink-0 ${n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'}`}>
                      {n.type.slice(0,3).toUpperCase()}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{n.title}</p>
                    {n.important && <span className="text-red-500 text-xs ml-auto flex-shrink-0">🔴</span>}
                  </div>
                )) : <p className="text-slate-400 text-sm text-center py-3">No notices</p>}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-black text-slate-800 mb-4">📝 Upcoming Exams</h2>
              <div className="space-y-2">
                {exams?.length ? exams.map(ex => {
                  const days = Math.ceil((new Date(ex.start_date).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={ex.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{ex.name}</p>
                        <p className="text-xs text-slate-400">{ex.start_date}</p>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${days<=7?'bg-red-50 text-red-600':'bg-green-50 text-green-700'}`}>
                        {days > 0 ? `${days}d` : 'Today!'}
                      </span>
                    </div>
                  )
                }) : <p className="text-slate-400 text-sm text-center py-3">No upcoming exams</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
