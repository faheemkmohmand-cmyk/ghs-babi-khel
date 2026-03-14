import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role,full_name').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { count: studentCount } = await supabase
    .from('students').select('*', { count: 'exact', head: true })

  const { count: teacherCount } = await supabase
    .from('teachers').select('*', { count: 'exact', head: true })

  const { count: noticeCount } = await supabase
    .from('notices').select('*', { count: 'exact', head: true }).eq('published', true)

  const { data: recentStudents } = await supabase
    .from('profiles')
    .select('id,full_name,created_at,role')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-slate-800 text-sm">GHS Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit"
                className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 rounded-3xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute right-6 top-6 text-8xl opacity-10 pointer-events-none">⚙️</div>
          <div className="relative z-10">
            <p className="text-white/50 text-sm font-semibold mb-1">Admin Dashboard</p>
            <h1 className="font-display text-2xl md:text-3xl font-black mb-2">Welcome, {profile?.full_name || 'Admin'}</h1>
            <p className="text-white/50 text-sm">Manage the school from here. All changes are live instantly.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '🎓', label: 'Students', value: studentCount ?? 0, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
            { icon: '👨‍🏫', label: 'Teachers', value: teacherCount ?? 0, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
            { icon: '📢', label: 'Notices', value: noticeCount ?? 0, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
            { icon: '📚', label: 'Classes', value: 12, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} ${s.border} border-2 rounded-2xl p-5`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`font-display text-3xl font-black ${s.text}`}>{s.value}</div>
              <div className="text-slate-500 text-xs font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Management Links */}
        <h2 className="font-display text-xl font-black text-slate-800 mb-4">Management</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '👨‍🏫', label: 'Teachers', href: '/admin/teachers', bg: 'bg-white', desc: 'Add/edit staff' },
            { icon: '📢', label: 'Notices', href: '/admin/notices', bg: 'bg-white', desc: 'Post announcements' },
            { icon: '📝', label: 'Exams', href: '/admin/exams', bg: 'bg-white', desc: 'Schedule exams' },
            { icon: '📊', label: 'Results', href: '/admin/results', bg: 'bg-white', desc: 'Enter marks' },
            { icon: '🏆', label: 'Achievements', href: '/admin/achievements', bg: 'bg-white', desc: 'Student awards' },
            { icon: '🖼️', label: 'Gallery', href: '/admin/gallery', bg: 'bg-white', desc: 'School photos' },
            { icon: '⚙️', label: 'Settings', href: '/admin/settings', bg: 'bg-white', desc: 'School info' },
          ].map(m => (
            <Link key={m.href} href={m.href}
              className="bg-white border-2 border-slate-100 rounded-2xl p-4 hover:-translate-y-1 hover:shadow-md hover:border-green-200 transition-all group">
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="font-bold text-sm text-slate-800">{m.label}</div>
              <div className="text-slate-400 text-xs mt-0.5">{m.desc}</div>
            </Link>
          ))}
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-black text-slate-800 mb-4">🆕 Recent Student Registrations</h2>
          {recentStudents?.length ? (
            <div className="space-y-2">
              {recentStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-black">
                      {s.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.full_name}</p>
                      <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">New</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">No students registered yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
