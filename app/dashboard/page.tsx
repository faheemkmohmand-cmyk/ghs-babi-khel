'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [state, setState] = useState<'loading'|'ready'|'error'>('loading')
  const [user, setUser]   = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [exams, setExams]     = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      try {
        const [p, n, e] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
          supabase.from('notices').select('id,title,type,date,important').eq('published', true).order('date',{ascending:false}).limit(5),
          supabase.from('exams').select('id,name,start_date').eq('status','upcoming').order('start_date',{ascending:true}).limit(4),
        ])
        setProfile((p as any).data)
        setNotices((n as any).data || [])
        setExams((e as any).data || [])
      } catch(_) {}
      setState('ready')
    }).catch(() => { window.location.href = '/login' })
  }, [])

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const h = new Date().getHours()
  const greeting = h<12?'Good Morning':h<17?'Good Afternoon':'Good Evening'

  if (state === 'loading') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 font-semibold">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
            <span className="font-bold text-slate-800 text-sm">GHS Babi Khel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-bold px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-800">🏠 Home</Link>
            <span className="text-slate-500 text-sm hidden sm:block">{name}</span>
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">
              {name.charAt(0).toUpperCase()}
            </div>
            <form action="/auth/signout" method="post">
              <button className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl p-6 md:p-8 text-white mb-7" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
          <p className="text-white/50 text-sm mb-0.5">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-black mb-1">{name}</h1>
          <p className="text-white/40 text-sm">Welcome to GHS Babi Khel Student Portal</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            {icon:'📊',label:'Results',href:'/results',bg:'#ecfdf5',border:'#bbf7d0',text:'#14532d'},
            {icon:'📅',label:'Timetable',href:'/timetable',bg:'#eff6ff',border:'#bfdbfe',text:'#1e3a8a'},
            {icon:'🏆',label:'Achievements',href:'/achievements',bg:'#faf5ff',border:'#e9d5ff',text:'#581c87'},
            {icon:'📢',label:'Notices',href:'/notices',bg:'#fffbeb',border:'#fde68a',text:'#78350f'},
          ].map(q=>(
            <Link key={q.href} href={q.href} className="rounded-2xl p-4 text-center hover:-translate-y-1 hover:shadow-md transition-all border-2" style={{background:q.bg,borderColor:q.border}}>
              <div className="text-2xl mb-1">{q.icon}</div>
              <div className="font-black text-sm" style={{color:q.text}}>{q.label}</div>
            </Link>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-800">📢 Latest Notices</h2>
              <Link href="/notices" className="text-green-900 text-sm font-bold">See all</Link>
            </div>
            {notices.length ? notices.map((n:any)=>(
              <div key={n.id} className="flex gap-2.5 p-3 bg-slate-50 rounded-xl mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${n.type==='exam'?'bg-red-500':n.type==='holiday'?'bg-sky-500':n.type==='event'?'bg-green-600':'bg-amber-500'}`}>
                  {(n.type||'').slice(0,3).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-400">{n.date}</p>
                </div>
              </div>
            )) : <p className="text-slate-400 text-sm text-center py-6">No notices yet</p>}
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-6">
            <h2 className="font-black text-slate-800 mb-4">📝 Upcoming Exams</h2>
            {exams.length ? exams.map((ex:any)=>{
              const days = Math.ceil((new Date(ex.start_date).getTime()-Date.now())/86400000)
              return (
                <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{ex.name}</p>
                    <p className="text-xs text-slate-400">{ex.start_date}</p>
                  </div>
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full ${days<=7?'bg-red-50 text-red-600':days<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>
                    {days>0?`${days}d left`:'Today!'}
                  </span>
                </div>
              )
            }) : <p className="text-slate-400 text-sm text-center py-6">No upcoming exams</p>}
          </div>
        </div>
      </main>
    </div>
  )
}
