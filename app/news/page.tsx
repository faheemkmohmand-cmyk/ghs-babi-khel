import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewsPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle() as any
  const { data: articles } = await supabase.from('news').select('*').eq('published',true).order('date',{ascending:false})
  const featured = articles?.find(a=>a.featured)
  const rest = articles?.filter(a=>!a.featured)||[]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ News</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>📰 School News</h1>
        <p className="text-slate-500 mb-8">Latest updates and stories from GHS Babi Khel</p>

        {!articles?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📰</div>
            <p className="text-slate-500 font-semibold">No news articles yet</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-md mb-8">
                {featured.image_url && <img src={featured.image_url} className="w-full h-64 object-cover" alt="" />}
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">⭐ Featured</span>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{featured.category}</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2 leading-snug" style={{fontFamily:'Georgia,serif'}}>{featured.title}</h2>
                  <p className="text-slate-500 leading-relaxed mb-4">{featured.content}</p>
                  <div className="text-xs text-slate-400">📅 {featured.date} · ✍️ {featured.author}</div>
                </div>
              </div>
            )}

            {/* Article grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map(a=>(
                <div key={a.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
                  {a.image_url && <img src={a.image_url} className="w-full h-40 object-cover" alt="" />}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">{a.category}</span>
                    </div>
                    <h3 className="font-black text-slate-800 leading-snug mb-2">{a.title}</h3>
                    <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed">{a.content}</p>
                    <div className="text-xs text-slate-400 mt-3">📅 {a.date} · {a.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
