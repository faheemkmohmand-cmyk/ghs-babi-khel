import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AchievementsPage() {
  const supabase = createClient()
  const { data: settings } = await (supabase as any).from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
  const { data: achievements } = await (supabase as any).from('achievements').select('*').order('date',{ascending:false})
  const featured = achievements?.filter(a=>a.featured)||[]
  const rest = achievements?.filter(a=>!a.featured)||[]

  const levelColors: Record<string,string> = {
    School:'bg-slate-100 text-slate-600', District:'bg-blue-50 text-blue-700',
    Provincial:'bg-purple-50 text-purple-700', National:'bg-amber-50 text-amber-700',
    International:'bg-red-50 text-red-700 border border-red-200'
  }
  const catIcons: Record<string,string> = {
    Academic:'📚',Sports:'⚽',Arts:'🎨',Science:'🔬',Debate:'🎤',Community:'🤝',Technology:'💻',Other:'🏆'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Achievements</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>🏆 Our Achievements</h1>
        <p className="text-slate-500 mb-8">Proud moments of GHS Babi Khel students</p>

        {!achievements?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-slate-500 font-semibold">Achievements will appear here soon</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-8">
                <h2 className="font-black text-slate-600 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>⭐ Featured Achievements</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {featured.map(a=>(
                    <div key={a.id} className="bg-white rounded-3xl border-2 border-amber-200 overflow-hidden shadow-md hover:shadow-lg transition-all">
                      {a.photo_url && <img src={a.photo_url} className="w-full h-48 object-cover" alt="" />}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xl">{catIcons[a.category]||'🏆'}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{a.category}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${levelColors[a.level]}`}>{a.level}</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-lg leading-snug mb-1" style={{fontFamily:'Georgia,serif'}}>{a.title}</h3>
                        <p className="text-green-900 font-bold text-sm">{a.student_name}{a.class&&` · Class ${a.class}`}</p>
                        {a.description && <p className="text-slate-500 text-sm mt-2 leading-relaxed">{a.description}</p>}
                        {a.prize && <p className="text-amber-600 text-sm font-bold mt-2">🏅 {a.prize}</p>}
                        <p className="text-slate-400 text-xs mt-2">📅 {a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All others */}
            {rest.length > 0 && (
              <div>
                {featured.length > 0 && <h2 className="font-black text-slate-600 text-xs uppercase tracking-widest mb-4">All Achievements</h2>}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(a=>(
                    <div key={a.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                      {a.photo_url && <img src={a.photo_url} className="w-full h-36 object-cover" alt="" />}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span>{catIcons[a.category]||'🏆'}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${levelColors[a.level]}`}>{a.level}</span>
                        </div>
                        <h3 className="font-black text-slate-800 leading-snug mb-1">{a.title}</h3>
                        <p className="text-green-900 font-bold text-xs">{a.student_name}{a.class&&` · Class ${a.class}`}</p>
                        {a.prize && <p className="text-amber-600 text-xs font-bold mt-1">🏅 {a.prize}</p>}
                        <p className="text-slate-400 text-xs mt-1">📅 {a.date}</p>
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
