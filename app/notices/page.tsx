import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NoticesPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle() as any
  const { data: notices } = await supabase.from('notices').select('*').eq('published',true).order('date',{ascending:false})
  const typeColors: Record<string,string> = { exam:'bg-red-500', holiday:'bg-sky-500', event:'bg-green-600', general:'bg-amber-500' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy-900 text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Notices</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>📢 Notice Board</h1>
        <p className="text-slate-500 mb-8">Official announcements from school administration</p>
        <div className="space-y-4">
          {notices?.length ? notices.map(n=>(
            <div key={n.id} className={`bg-white rounded-2xl border p-5 flex gap-4 ${n.important?'border-red-200':'border-slate-100'}`}>
              <span className={`${typeColors[n.type]||'bg-slate-500'} text-white text-xs font-black px-2.5 py-1 rounded-lg h-fit flex-shrink-0`}>{n.type.toUpperCase()}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-black text-slate-800">{n.title}</h3>
                  {n.important && <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">🔴 Important</span>}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{n.content}</p>
                <div className="flex gap-3 mt-2 text-xs text-slate-400">
                  <span>📅 {n.date}</span><span>👤 {n.posted_by}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="text-5xl mb-3">📢</div>
              <p className="text-slate-400 font-semibold">No notices posted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
