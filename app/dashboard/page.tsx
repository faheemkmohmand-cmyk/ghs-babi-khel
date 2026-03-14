'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [exams, setExams]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const [{ data: profile }, { data: student }, { data: notices }, { data: exams }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('students').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('notices').select('id,title,type,date,important').eq('published', true).order('date', { ascending: false }).limit(5),
        supabase.from('exams').select('id,name,start_date,status').eq('status', 'upcoming').order('start_date', { ascending: true }).limit(4),
      ])
      setProfile(profile)
      setStudent(student)
      setNotices(notices || [])
      setExams(exams || [])
      setLoading(false)
    }
    load()
  }, [])

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  const now = new Date()

  // Display name: full_name from profile, else extract name from email
  const displayName = profile?.full_name
    || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Student')

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 font-semibold">Loading your dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
            <span className="font-bold text-slate-800 text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{displayName}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">
              {displayName[0]?.toUpperCase()}
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 font-semibold px-3 py-1.5 rounded-lg transition-all">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Welcome Banner */}
        <div className="rounded-3xl p-6 md:p-8 text-white mb-7 relative overflow-hidden" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
          <div className="absolute right-4 text-8xl opacity-5 top-0 bottom-0 flex items-center pointer-events-none select-none">🎓</div>
          <p className="text-white/50 text-sm mb-0.5">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-black mb-1" style={{fontFamily:'Georgia,serif'}}>{displayName}</h1>
          <p className="text-white/40 text-sm">Welcome to GHS Babi Khel Student Portal</p>
          {student && (
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl">📚 Class {student.class}{student.section}</span>
              <span className="bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-xl">🔢 Roll No. {student.roll_no}</span>
            </div>
          )}
        </div>

        {/* Quick links — My portal */}
        <h2 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-3">My Portal</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {icon:'📊', label:'Overall Results',           sub:'Class 6th to 10th',    href:'/dashboard/results',    bg:'#ecfdf5', border:'#bbf7d0', text:'#14532d'},
            {icon:'✅', label:'Overall Attendance',        sub:'Class 6th to 10th',    href:'/dashboard/attendance', bg:'#eff6ff', border:'#bfdbfe', text:'#1e3a8a'},
            {icon:'📅', label:'Timetable',                 sub:'Class schedule',        href:'/timetable',            bg:'#faf5ff', border:'#e9d5ff', text:'#581c87'},
            {icon:'📢', label:'Notices',                   sub:'School announcements',  href:'/notices',              bg:'#fffbeb', border:'#fde68a', text:'#78350f'},
          ].map(q=>(
            <Link key={q.href} href={q.href}
              className="rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all border-2"
              style={{background:q.bg, borderColor:q.border}}>
              <div className="text-2xl mb-1">{q.icon}</div>
              <div className="font-black text-sm leading-tight" style={{color:q.text}}>{q.label}</div>
              <div className="text-xs mt-0.5 opacity-60" style={{color:q.text}}>{q.sub}</div>
            </Link>
          ))}
        </div>

        {/* School sections */}
        <h2 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-3">Explore School</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-8">
          {[
            {icon:'👨‍🏫', label:'Teachers',     href:'/teachers'},
            {icon:'🖼️', label:'Gallery',       href:'/gallery'},
            {icon:'📰', label:'News',          href:'/news'},
            {icon:'🏆', label:'Achievements',  href:'/achievements'},
            {icon:'📚', label:'Library',       href:'/library'},
            {icon:'ℹ️', label:'About',         href:'/about'},
            {icon:'📋', label:'Results',       href:'/results'},
          ].map(q=>(
            <Link key={q.href} href={q.href}
              className="bg-white border-2 border-slate-100 rounded-2xl p-3 text-center hover:-translate-y-1 hover:shadow-md hover:border-green-200 transition-all">
              <div className="text-2xl mb-1">{q.icon}</div>
              <div className="font-bold text-xs text-slate-600">{q.label}</div>
            </Link>
          ))}
        </div>

        {/* Notices + Exams */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📢 Latest Notices</h2>
              <Link href="/notices" className="text-green-900 text-sm font-bold hover:underline">See all</Link>
            </div>
            <div className="space-y-2.5">
              {notices.length ? notices.map(n=>(
                <div key={n.id} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white flex-shrink-0 mt-0.5 ${n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'}`}>
                    {(n.type||'').slice(0,3).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.date}</p>
                  </div>
                  {n.important && <span className="text-red-500 text-xs">🔴</span>}
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-6">No notices yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6">
            <h2 className="font-black text-slate-800 mb-4" style={{fontFamily:'Georgia,serif'}}>📝 Upcoming Exams</h2>
            <div className="space-y-2.5">
              {exams.length ? exams.map(ex=>{
                const days = Math.ceil((new Date(ex.start_date).getTime()-now.getTime())/86400000)
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{ex.name}</p>
                      <p className="text-xs text-slate-400">{ex.start_date}</p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full ${days<=7?'bg-red-50 text-red-600':days<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>
                      {days > 0 ? `${days}d left` : 'Today!'}
                    </span>
                  </div>
                )
              }) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-slate-400 text-sm">No upcoming exams scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
