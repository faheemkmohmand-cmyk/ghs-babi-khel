import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AchievementsPage() {
  const supabase = createClient()
  const { data: achievements } = await supabase.from('achievements').select('*').order('year',{ascending:false})
  const featured = achievements?.filter(a=>a.featured)||[]
  const rest = achievements?.filter(a=>!a.featured)||[]
  const catIcons: Record<string,string> = { academic:'📚', sports:'⚽', science:'🔬', extracurricular:'🎨', environment:'🌿' }

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

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-navy-800 mb-2">🏆 Achievements</h1>
          <p className="text-slate-500">Proud moments of GHS Babi Khel students and staff</p>
        </div>

        {!achievements?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-slate-500 font-semibold">Achievements coming soon</p>
          </div>
        ) : (
          <>
            {featured.length>0&&(
              <div className="mb-8">
                <h2 className="font-display font-black text-navy-800 text-lg mb-4 flex items-center gap-2"><span>⭐</span> Featured Achievements</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {featured.map(a=>(
                    <div key={a.id} className="bg-white rounded-3xl border-2 border-amber-200 overflow-hidden shadow-md">
                      {a.image_url&&<img src={a.image_url} className="w-full h-44 object-cover" alt=""/>}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{a.icon||catIcons[a.category]||'🏆'}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg capitalize">{a.category}</span>
                          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg ml-auto">⭐ Featured</span>
                        </div>
                        <h3 className="font-display font-black text-navy-800 text-lg leading-snug mb-1">{a.title}</h3>
                        <p className="text-green-900 font-bold text-sm">{a.recipient}</p>
                        <p className="text-slate-500 text-sm mt-1 leading-relaxed">{a.description}</p>
                        <p className="text-slate-400 text-xs mt-2">{a.year} · {a.awarded_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rest.length>0&&(
              <div>
                {featured.length>0&&<h2 className="font-display font-black text-navy-800 text-lg mb-4">All Achievements</h2>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(a=>(
                    <div key={a.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                      {a.image_url&&<img src={a.image_url} className="w-full h-32 object-cover" alt=""/>}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{a.icon||catIcons[a.category]||'🏆'}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg capitalize">{a.category}</span>
                        </div>
                        <h3 className="font-black text-navy-800 leading-snug mb-1">{a.title}</h3>
                        <p className="text-green-900 font-bold text-xs">{a.recipient}</p>
                        <p className="text-slate-400 text-xs mt-1">{a.year} · {a.awarded_by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
