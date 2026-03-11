import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AchievementsPage() {
  const supabase = createClient()
  const { data: achievements } = await supabase.from('achievements').select('*').order('year', { ascending:false })

  const catColor: Record<string,string> = { academic:'bg-green-50 text-green-700 border-green-100', sports:'bg-sky-50 text-sky-700 border-sky-100', science:'bg-purple-50 text-purple-700 border-purple-100', extracurricular:'bg-amber-50 text-amber-700 border-amber-100', environment:'bg-emerald-50 text-emerald-700 border-emerald-100' }

  const years = [...new Set((achievements||[]).map(a => a.year))].sort((a,b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Achievements</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">🏆 Our Achievements</h1>
        <p className="text-slate-500 mb-8">Honours and recognition earned by GHS Babi Khel students</p>

        {!achievements?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-slate-400 font-semibold">Achievements will appear here</p>
          </div>
        ) : (
          <div className="space-y-10">
            {years.map(year => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-2xl font-black text-slate-800">{year}</h2>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.filter(a => a.year === year).map(a => (
                    <div key={a.id} className={`bg-white rounded-2xl border-2 p-5 hover:shadow-md transition-all ${a.featured ? 'border-amber-200' : 'border-slate-100'}`}>
                      {a.featured && <div className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg inline-block mb-3">⭐ Featured</div>}
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-3xl flex-shrink-0">{a.icon || '🏆'}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${catColor[a.category]||'bg-slate-50 text-slate-600 border-slate-100'}`}>{a.category}</span>
                      </div>
                      <h3 className="font-display font-black text-slate-800 mb-2 leading-snug">{a.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-3">{a.description}</p>
                      <div className="pt-3 border-t border-slate-50 space-y-1">
                        <p className="text-xs text-slate-500">🎓 <strong>{a.recipient}</strong></p>
                        <p className="text-xs text-slate-400">🏛️ {a.awarded_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
