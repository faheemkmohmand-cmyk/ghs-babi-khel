import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NoticesPage() {
  const supabase = createClient()
  const { data: notices } = await supabase.from('notices').select('*').eq('published', true).order('date', { ascending: false })
  const typeColor: Record<string,string> = { exam:'bg-red-500', holiday:'bg-sky-500', event:'bg-green-600', general:'bg-amber-500' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Notices</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">Home</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📢 Notice Board</h1>
        <p className="text-slate-500 mb-8">Important announcements from school administration</p>
        {!notices?.length ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <div className="text-5xl mb-3">📢</div>
            <p className="text-slate-400 font-semibold">No notices yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(n => (
              <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <span className={`${typeColor[n.type]||'bg-slate-400'} text-white text-xs font-bold px-2.5 py-1 rounded-lg`}>{n.type.toUpperCase()}</span>
                  {n.important && <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-lg border border-red-200">🔴 Important</span>}
                  <span className="ml-auto text-slate-400 text-xs">{n.date}</span>
                </div>
                <h3 className="font-display font-black text-slate-800 text-lg">{n.title}</h3>
                <p className="text-slate-600 mt-2 leading-relaxed">{n.content}</p>
                <p className="text-slate-400 text-xs mt-3">By: {n.posted_by}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
