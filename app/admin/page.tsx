import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ count: students }, { count: teachers }, { count: notices }, { count: news }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('notices').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('news').select('*', { count: 'exact', head: true }).eq('published', true),
  ])

  const { data: recentStudents } = await supabase
    .from('profiles').select('id,full_name,created_at').eq('role','student')
    .order('created_at', { ascending: false }).limit(5)

  const { data: exams } = await supabase
    .from('exams').select('id,name,start_date,status').eq('status','upcoming')
    .order('start_date', { ascending: true }).limit(3)

  return (
    <AdminLayout adminName={profile?.full_name || 'Admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-black text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {profile?.full_name}. Here's what's happening.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon:'🎓', label:'Total Students', value: students ?? 0, bg:'bg-green-50', text:'text-green-700', border:'border-green-100', href:'/admin/students' },
            { icon:'👨‍🏫', label:'Teachers',       value: teachers ?? 0, bg:'bg-sky-50',   text:'text-sky-700',   border:'border-sky-100',   href:'/admin/teachers' },
            { icon:'📢', label:'Active Notices',  value: notices ?? 0,  bg:'bg-amber-50', text:'text-amber-700', border:'border-amber-100', href:'/admin/notices' },
            { icon:'📰', label:'News Articles',   value: news ?? 0,     bg:'bg-purple-50',text:'text-purple-700',border:'border-purple-100',href:'/admin/news' },
          ].map(s => (
            <Link key={s.href} href={s.href}
              className={`${s.bg} ${s.border} border-2 rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`font-display text-3xl font-black ${s.text}`}>{s.value}</div>
              <div className="text-slate-500 text-xs font-semibold mt-1">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-lg font-black text-slate-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon:'➕', label:'Add Student',    href:'/admin/students' },
              { icon:'📢', label:'Post Notice',    href:'/admin/notices' },
              { icon:'📊', label:'Enter Results',  href:'/admin/results' },
              { icon:'✅', label:'Mark Attendance',href:'/admin/attendance' },
              { icon:'👨‍🏫', label:'Add Teacher',    href:'/admin/teachers' },
              { icon:'📰', label:'Write News',     href:'/admin/news' },
              { icon:'🏆', label:'Add Achievement',href:'/admin/achievements' },
              { icon:'⚙️', label:'Settings',       href:'/admin/settings' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="bg-white border-2 border-slate-100 rounded-xl p-3 flex items-center gap-3 hover:border-green-200 hover:shadow-sm transition-all">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm font-bold text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Registrations */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-display text-lg font-black text-slate-800 mb-4">🆕 Recent Registrations</h2>
            <div className="space-y-2">
              {recentStudents?.length ? recentStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-black flex-shrink-0">
                    {s.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{s.full_name}</p>
                    <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-4">No students yet</p>}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-black text-slate-800">📝 Upcoming Exams</h2>
              <Link href="/admin/exams" className="text-green-800 text-xs font-bold hover:underline">Manage →</Link>
            </div>
            <div className="space-y-2">
              {exams?.length ? exams.map(ex => {
                const days = Math.ceil((new Date(ex.start_date).getTime() - Date.now()) / 86400000)
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${days <= 7 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {days > 0 ? `${days}d` : 'Today'}
                    </span>
                  </div>
                )
              }) : <p className="text-slate-400 text-sm text-center py-4">No upcoming exams</p>}
            </div>
            <Link href="/admin/exams"
              className="mt-4 w-full block text-center bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 text-slate-600 hover:text-green-800 text-sm font-bold py-2.5 rounded-xl transition-all">
              + Schedule Exam
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
