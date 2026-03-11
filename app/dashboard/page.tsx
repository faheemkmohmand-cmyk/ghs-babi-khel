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
  const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()

  const { data: notices } = await supabase.from('notices').select('id,title,type,date,important')
    .eq('published',true).order('date',{ascending:false}).limit(4)
  const { data: exams } = await supabase.from('exams').select('id,name,start_date,status')
    .eq('status','upcoming').order('start_date',{ascending:true}).limit(3)

  // Today's timetable
  const now = new Date()
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName = dayNames[now.getDay()]
  const studentClass = student?.class || null

  const { data: todaySchedule } = studentClass ? await supabase.from('timetable')
    .select('*').eq('class', studentClass).eq('section','A').eq('day', todayName).order('period') : { data: null }

  // Library — books issued to this student
  const { data: issuedBooks } = student ? await supabase.from('book_issues')
    .select('*, books(title, author)')
    .eq('student_id', student.id).eq('status','issued').order('due_date') : { data: null }

  const today = now.toISOString().split('T')[0]
  const overdueBooks = (issuedBooks || []).filter(i => i.due_date < today)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  // Current period
  const timeStr = `${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const currentPeriod = (todaySchedule || []).find(p => p.start_time <= timeStr && p.end_time >= timeStr)
  const nextPeriod = (todaySchedule || []).find(p => p.start_time > timeStr)

  const SUBJECT_COLORS: Record<string,string> = {
    'Mathematics':'bg-blue-100 text-blue-800','Physics':'bg-purple-100 text-purple-800',
    'Chemistry':'bg-green-100 text-green-800','Biology':'bg-emerald-100 text-emerald-800',
    'English':'bg-amber-100 text-amber-800','Urdu':'bg-rose-100 text-rose-800',
    'Islamiat':'bg-teal-100 text-teal-800','Pakistan Studies':'bg-orange-100 text-orange-800',
    'Computer':'bg-sky-100 text-sky-800',
  }
  function subjectColor(subject: string) { return SUBJECT_COLORS[subject] || 'bg-indigo-100 text-indigo-800' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-slate-800 text-sm">GHS Babi Khel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <LogoutButton/>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden" style={{background:'linear-gradient(135deg,#0a1628 0%,#014d26 100%)'}}>
          <div className="absolute right-4 top-4 text-7xl opacity-10 pointer-events-none">🎓</div>
          <p className="text-white/50 text-sm font-semibold mb-1">{greeting} 👋</p>
          <h1 className="font-display text-2xl md:text-3xl font-black mb-2">{profile?.full_name || 'Student'}</h1>
          <p className="text-white/50 text-sm">
            {student ? `Class ${student.class} · Roll No. ${student.roll_no} · GHS Babi Khel` : 'GHS Babi Khel Student Portal'}
          </p>
          {!student && (
            <p className="text-amber-300 text-sm mt-3 bg-amber-900/30 border border-amber-500/25 rounded-xl px-4 py-2 inline-block">
              ⚠️ Student profile not linked. Contact admin.
            </p>
          )}
        </div>

        {/* Overdue Warning */}
        {overdueBooks.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <p className="font-black text-red-700">Overdue Library Books!</p>
              <p className="text-red-500 text-sm">{overdueBooks.length} book{overdueBooks.length>1?'s':''} past due date — please return to library</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon:'📊', label:'My Results',  href:'/dashboard/results',    bg:'bg-green-50 border-green-200 text-green-700' },
            { icon:'✅', label:'Attendance',  href:'/dashboard/attendance', bg:'bg-sky-50 border-sky-200 text-sky-700' },
            { icon:'📅', label:'Timetable',   href:'/timetable',            bg:'bg-purple-50 border-purple-200 text-purple-700' },
            { icon:'📚', label:'Library',     href:'/library',              bg:'bg-rose-50 border-rose-200 text-rose-700' },
          ].map(q => (
            <Link key={q.href} href={q.href}
              className={`border-2 rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all ${q.bg}`}>
              <div className="text-2xl mb-2">{q.icon}</div>
              <div className="font-black text-sm">{q.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Timetable */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">📅 Today — {todayName}</h2>
              <Link href="/timetable" className="text-green-900 text-sm font-bold hover:underline">Full →</Link>
            </div>
            {!studentClass ? (
              <p className="text-slate-400 text-sm text-center py-6">Link your student profile to see timetable</p>
            ) : !todaySchedule?.length ? (
              <p className="text-slate-400 text-sm text-center py-6">
                {now.getDay() === 0 ? '🌙 Sunday — No school' : 'No schedule available'}
              </p>
            ) : (
              <>
                {currentPeriod && (
                  <div className={`mb-4 p-3 rounded-2xl border-2 border-green-400 ${subjectColor(currentPeriod.subject)}`}>
                    <div className="text-xs font-black uppercase tracking-widest text-green-700 mb-1">🟢 Now</div>
                    <div className="font-black text-lg">{currentPeriod.subject}</div>
                    {currentPeriod.teacher_name && <div className="text-sm opacity-70">👤 {currentPeriod.teacher_name}</div>}
                    <div className="text-xs opacity-60 mt-1">{currentPeriod.start_time} – {currentPeriod.end_time}</div>
                  </div>
                )}
                {nextPeriod && !currentPeriod && (
                  <div className="mb-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">⏭ Next Up</div>
                    <div className="font-black text-slate-700">{nextPeriod.subject}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{nextPeriod.start_time} – {nextPeriod.end_time}</div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {todaySchedule.map(p => (
                    <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      currentPeriod?.id === p.id ? 'ring-2 ring-green-400 ' + subjectColor(p.subject) :
                      p.end_time < timeStr ? 'opacity-40 bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                    }`}>
                      <span className="w-6 h-6 rounded-full bg-white shadow-sm text-xs font-black flex items-center justify-center text-slate-600 flex-shrink-0">{p.period}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-sm text-slate-800">{p.subject}</span>
                        {p.teacher_name && <span className="text-slate-400 text-xs ml-2">· {p.teacher_name}</span>}
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{p.start_time}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Library status */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-black text-slate-800">📚 My Library</h2>
                <Link href="/library" className="text-green-900 text-sm font-bold hover:underline">Browse →</Link>
              </div>
              {!student ? (
                <p className="text-slate-400 text-sm text-center py-4">Login linked profile to see books</p>
              ) : !issuedBooks?.length ? (
                <p className="text-slate-400 text-sm text-center py-4">No books currently issued to you</p>
              ) : (
                <div className="space-y-2">
                  {issuedBooks.map(i => {
                    const overdue = i.due_date < today
                    return (
                      <div key={i.id} className={`flex items-start gap-3 p-3 rounded-xl border ${overdue?'bg-red-50 border-red-200':'bg-slate-50 border-slate-100'}`}>
                        <span className="text-xl flex-shrink-0">📖</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm leading-snug ${overdue?'text-red-700':'text-slate-800'}`}>{(i.books as any)?.title}</p>
                          <p className={`text-xs mt-0.5 ${overdue?'text-red-500 font-bold':'text-slate-400'}`}>
                            Due: {i.due_date} {overdue && '— OVERDUE!'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Notices */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-black text-slate-800">📢 Notices</h2>
                <Link href="/notices" className="text-green-900 text-sm font-bold hover:underline">All →</Link>
              </div>
              <div className="space-y-2">
                {notices?.length ? notices.map(n => (
                  <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md text-white flex-shrink-0 mt-0.5 ${
                      n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'
                    }`}>{n.type?.slice(0,3).toUpperCase()}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-400">{n.date}</p>
                    </div>
                    {n.important && <span className="text-red-500 text-xs ml-auto flex-shrink-0">🔴</span>}
                  </div>
                )) : <p className="text-slate-400 text-sm text-center py-3">No notices</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        {exams && exams.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-black text-slate-800 mb-4">📝 Upcoming Exams</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {exams.map(ex => {
                const days = Math.ceil((new Date(ex.start_date).getTime()-now.getTime())/(1000*60*60*24))
                return (
                  <div key={ex.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${
                      days<=7?'bg-red-50 text-red-600 border-red-100':
                      days<=30?'bg-amber-50 text-amber-600 border-amber-100':
                      'bg-green-50 text-green-700 border-green-100'
                    }`}>{days>0?`${days}d left`:'Today!'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
