import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function NewsPage() {
  const supabase = createClient()
  const { data: news } = await supabase.from('news').select('*').eq('published', true).order('date', { ascending:false })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ News</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📰 School News</h1>
        <p className="text-slate-500 mb-8">Latest news and updates from GHS Babi Khel</p>
        {!news?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📰</div>
            <p className="text-slate-400 font-semibold">No news articles yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.filter(n => n.featured).length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 to-green-950 rounded-3xl p-6 text-white mb-6">
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">⭐ Featured</div>
                <h2 className="font-display text-2xl font-black mb-2">{news.find(n => n.featured)?.title}</h2>
                <p className="text-white/60 leading-relaxed line-clamp-3">{news.find(n => n.featured)?.content}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-white/40">
                  <span>{news.find(n => n.featured)?.date}</span>
                  <span>·</span>
                  <span>{news.find(n => n.featured)?.author}</span>
                </div>
              </div>
            )}
            {news.map(n => (
              <div key={n.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-2">
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg">{n.category}</span>
                  <span className="ml-auto text-slate-400 text-xs">{n.date}</span>
                </div>
                <h3 className="font-display font-black text-slate-800 text-lg leading-snug">{n.title}</h3>
                <p className="text-slate-600 mt-2 leading-relaxed">{n.content}</p>
                <p className="text-slate-400 text-xs mt-3">By {n.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
