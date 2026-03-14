import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function NoticesPage() {
  const supabase = createClient()
  const { data: notices } = await supabase.from('notices').select('*').eq('published',true).order('date',{ascending:false})
  const typeColors: Record<string,string> = { exam:'bg-red-500', holiday:'bg-sky-500', event:'bg-green-600', general:'bg-amber-500' }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy-900/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-white text-sm">GHS Babi Khel</span>
          </Link>
          <Link href="/" className="text-white/40 hover:text-white text-sm font-semibold transition-colors">← Home</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-navy-800 mb-2">📢 Notice Board</h1>
          <p className="text-slate-500">Official announcements from GHS Babi Khel administration</p>
        </div>

        {!notices?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📢</div>
            <p className="text-slate-500 font-semibold">No notices posted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map(n=>(
              <div key={n.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${n.important?'border-l-4 border-l-red-500':'border-slate-100'}`}>
                <div className="p-5 flex items-start gap-4">
                  <span className={`${typeColors[n.type]||'bg-slate-400'} text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase flex-shrink-0`}>{n.type}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-navy-800">{n.title}</h3>
                      {n.important&&<span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-2 py-0.5 rounded-lg">🔴 Important</span>}
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">{n.content}</p>
                    <p className="text-slate-400 text-xs mt-2">📅 {n.date} · Posted by {n.posted_by||'Administration'} · For {n.audience||'All'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
