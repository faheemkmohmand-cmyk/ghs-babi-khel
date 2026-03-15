'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


export default function AdminDashboard() {
  const [profile, setProfile]         = useState<any>(null)
  const [stats, setStats]             = useState({students:0,teachers:0,notices:0,books:0})
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [recentNotices, setRecentNotices]   = useState<any[]>([])
  const [upcomingExams, setUpcomingExams]   = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [schoolInfo, setSchoolInfo]   = useState<any>(null)
  const [savingInfo, setSavingInfo]   = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      // First try getSession (instant, reads cookie) then getUser as fallback
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (!user) { window.location.href = '/login'; return }

      const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle() as any
      if (!profile || profile.role !== 'admin') { window.location.href = '/dashboard'; return }
      setProfile(profile)

      const [
        { count: students },
        { count: teachers },
        { count: notices },
        { count: books },
        { data: recentStudents },
        { data: recentNotices },
        { data: upcomingExams },
      ] = await Promise.all([
        supabase.from('students').select('*',{count:'exact',head:true}).eq('status','active'),
        supabase.from('teachers').select('*',{count:'exact',head:true}).eq('status','active'),
        supabase.from('notices').select('*',{count:'exact',head:true}).eq('published',true),
        supabase.from('books').select('*',{count:'exact',head:true}),
        supabase.from('students').select('id,full_name,class,section,roll_no').order('created_at',{ascending:false}).limit(6),
        supabase.from('notices').select('id,title,type,important,date').order('date',{ascending:false}).limit(5),
        supabase.from('exams').select('id,name,start_date,type').eq('status','upcoming').order('start_date',{ascending:true}).limit(3),
      ])

      setStats({ students:students||0, teachers:teachers||0, notices:notices||0, books:books||0 })

      const { data: settings } = await supabase.from('school_settings').select('id,total_students,total_teachers,established_year,total_classes').limit(1).maybeSingle() as any
      setSchoolInfo(settings || { id:'', total_students:450, total_teachers:18, established_year:'1989', total_classes:12 })
      setRecentStudents(recentStudents||[])
      setRecentNotices(recentNotices||[])
      setUpcomingExams(upcomingExams||[])
      setLoading(false)
    }
    load()
  }, [])

  async function saveSchoolInfo() {
    if (!schoolInfo) return
    const supabase = createClient()
    setSavingInfo(true)
    try {
      if (schoolInfo.id) {
        await supabase.from('school_settings').update({
          total_students: Number(schoolInfo.total_students),
          total_teachers: Number(schoolInfo.total_teachers),
          established_year: schoolInfo.established_year,
          total_classes: Number(schoolInfo.total_classes),
        } as any).eq('id', schoolInfo.id)
      }
    } finally { setSavingInfo(false) }
  }

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  const now = new Date()

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 font-semibold">Loading admin panel...</p>
      </div>
    </div>
  )

  const statCards = [
    {icon:'🎓',label:'Total Students',  num:stats.students, color:'#016633', bg:'rgba(1,102,51,0.1)',   href:'/admin/students'},
    {icon:'👨‍🏫',label:'Active Teachers', num:stats.teachers, color:'#2563eb', bg:'rgba(37,99,235,0.1)',  href:'/admin/teachers'},
    {icon:'📢',label:'Live Notices',    num:stats.notices,  color:'#d97706', bg:'rgba(217,119,6,0.1)',  href:'/admin/notices'},
    {icon:'📚',label:'Books in Library',num:stats.books,    color:'#7c3aed', bg:'rgba(124,58,237,0.1)', href:'/admin/library'},
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
            <span className="font-bold text-slate-800 text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel — Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 font-semibold px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="rounded-3xl p-6 md:p-8 text-white mb-6 relative overflow-hidden" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
          <div className="absolute right-6 top-0 bottom-0 flex items-center text-8xl opacity-5 pointer-events-none select-none">🏫</div>
          <p className="text-white/50 text-sm mb-1">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1" style={{fontFamily:'Georgia,serif'}}>{profile?.full_name}</h1>
          <p className="text-white/40 text-sm mb-4">You have full control of GHS Babi Khel portal</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/students"   className="bg-green-900 hover:bg-green-950 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">➕ Add Student</Link>
            <Link href="/admin/notices"    className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">📢 Post Notice</Link>
            <Link href="/admin/teachers"   className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">👨‍🏫 Add Teacher</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(s=>(
            <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all" style={{borderLeft:`4px solid ${s.color}`}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:s.bg}}>{s.icon}</div>
              <div>
                <div className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>{s.num}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-0.5">{s.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
          <h2 className="font-black text-slate-800 mb-4" style={{fontFamily:'Georgia,serif'}}>⚡ Quick Actions</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {[
              {icon:'🎓',label:'Students',   href:'/admin/students',   bg:'bg-green-50',  text:'text-green-700', border:'border-green-200'},
              {icon:'📊',label:'Results',    href:'/admin/results',    bg:'bg-purple-50', text:'text-purple-700',border:'border-purple-200'},
              {icon:'👨‍🏫',label:'Teachers',  href:'/admin/teachers',   bg:'bg-blue-50',   text:'text-blue-700',  border:'border-blue-200'},
              {icon:'📅',label:'Timetable',  href:'/admin/timetable',  bg:'bg-indigo-50', text:'text-indigo-700',border:'border-indigo-200'},
              {icon:'📢',label:'Notices',    href:'/admin/notices',    bg:'bg-amber-50',  text:'text-amber-700', border:'border-amber-200'},
              {icon:'📚',label:'Library',    href:'/admin/library',    bg:'bg-teal-50',   text:'text-teal-700',  border:'border-teal-200'},
              {icon:'⚙️',label:'Settings',   href:'/admin/settings',   bg:'bg-slate-100', text:'text-slate-600', border:'border-slate-200'},
            ].map(a=>(
              <Link key={a.href} href={a.href} className={`${a.bg} ${a.border} border-2 rounded-2xl p-3 text-center hover:-translate-y-1 hover:shadow-md transition-all`}>
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className={`${a.text} font-bold text-xs`}>{a.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* School Statistics — Editable */}
        {schoolInfo && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📊 School Statistics</h2>
              <button onClick={saveSchoolInfo} disabled={savingInfo}
                className="bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all">
                {savingInfo ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🎓 Total Students</label>
                <input type="number" value={schoolInfo.total_students}
                  onChange={e=>setSchoolInfo((p:any)=>({...p,total_students:e.target.value}))}
                  className="w-full border-2 border-slate-200 focus:border-green-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 outline-none transition-colors bg-white"/>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">👨‍🏫 Qualified Teachers</label>
                <input type="number" value={schoolInfo.total_teachers}
                  onChange={e=>setSchoolInfo((p:any)=>({...p,total_teachers:e.target.value}))}
                  className="w-full border-2 border-slate-200 focus:border-green-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 outline-none transition-colors bg-white"/>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📚 Classes Running</label>
                <input type="number" value={schoolInfo.total_classes}
                  onChange={e=>setSchoolInfo((p:any)=>({...p,total_classes:e.target.value}))}
                  className="w-full border-2 border-slate-200 focus:border-green-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 outline-none transition-colors bg-white"/>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">🏆 Established Year</label>
                <input type="text" value={schoolInfo.established_year}
                  onChange={e=>setSchoolInfo((p:any)=>({...p,established_year:e.target.value}))}
                  className="w-full border-2 border-slate-200 focus:border-green-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 outline-none transition-colors bg-white"
                  placeholder="1989"/>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-3">These numbers show on the homepage and about page of your website.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Students */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>🎓 Recent Students</h2>
              <Link href="/admin/students" className="text-green-900 text-sm font-bold hover:underline">Manage →</Link>
            </div>
            {recentStudents.length ? (
              <div className="space-y-2">
                {recentStudents.map(s=>(
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center text-white text-sm font-black flex-shrink-0">{s.full_name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{s.full_name}</div>
                      <div className="text-xs text-slate-400">Class {s.class}{s.section} · Roll {s.roll_no}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🎓</div>
                <p className="text-slate-400 text-sm mb-2">No students added yet</p>
                <Link href="/admin/students" className="text-green-900 font-bold text-sm hover:underline">Add first student →</Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <h3 className="font-black text-slate-800 mb-3 text-sm" style={{fontFamily:'Georgia,serif'}}>📝 Upcoming Exams</h3>
              {upcomingExams.length ? upcomingExams.map(e=>{
                const days = Math.ceil((new Date(e.start_date).getTime()-now.getTime())/86400000)
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{e.name}</p>
                      <p className="text-xs text-slate-400">{e.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${days<=7?'bg-red-50 text-red-600':days<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>
                      {days>0?`${days}d`:'Today'}
                    </span>
                  </div>
                )
              }) : <p className="text-slate-400 text-xs py-3 text-center">No upcoming exams</p>}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-slate-800 text-sm" style={{fontFamily:'Georgia,serif'}}>📢 Notices</h3>
                <Link href="/admin/notices" className="text-green-900 text-xs font-bold hover:underline">Manage</Link>
              </div>
              {recentNotices.length ? recentNotices.map(n=>(
                <div key={n.id} className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white flex-shrink-0 mt-0.5 ${n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'}`}>
                    {(n.type||'').slice(0,3).toUpperCase()}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 leading-snug">{n.title}</p>
                </div>
              )) : <p className="text-slate-400 text-xs py-3 text-center">No notices yet</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
