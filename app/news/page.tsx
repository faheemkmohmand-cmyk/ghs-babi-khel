export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewsPage() {
  const supabase = createClient()
  const { data: logoData } = await supabase.from('school_settings').select('logo_url').order('updated_at', { ascending: false }).limit(1)
  const logoUrl = logoData?.[0]?.logo_url || ''
  const { data: articles } = await supabase.from('news').select('*').eq('published',true).order('date',{ascending:false})
  const featured = articles?.find(a => a.featured)
  const rest = articles?.filter(a => !a.featured) || []

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>{logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full"/> : '🏫'}</div>
          <span className="font-bold text-sm hidden sm:block" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/ News</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📰 School News</h1>
        <p className="text-slate-500 mb-8">Latest news and updates from GHS Babi Khel</p>

        {!articles?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📰</div><p className="text-slate-400 font-semibold">No news published yet</p>
          </div>
        ) : (
          <>
            {featured && (
              <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-3xl p-8 text-white mb-8 relative overflow-hidden hover:shadow-2xl transition-all">
                <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-1 rounded-full">⭐ Featured</div>
                <div className="absolute right-0 bottom-0 text-[120px] opacity-5 pointer-events-none">📰</div>
                <span className="bg-white/10 text-white/80 text-xs font-bold px-2.5 py-1 rounded-lg">{featured.category}</span>
                <h2 className="font-display text-2xl md:text-3xl font-black mt-3 mb-3 leading-tight">{featured.title}</h2>
                <p className="text-white/60 leading-relaxed line-clamp-3">{featured.content}</p>
                <p className="text-white/30 text-xs mt-4">{featured.date} · {featured.author}</p>
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {rest.map(a => (
                  <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">{a.category}</span>
                      <span className="text-slate-400 text-xs">{a.date}</span>
                    </div>
                    <h3 className="font-display font-black text-slate-800 text-lg leading-snug mb-2">{a.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{a.content}</p>
                    <p className="text-slate-400 text-xs mt-3 pt-3 border-t border-slate-50">By {a.author}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
