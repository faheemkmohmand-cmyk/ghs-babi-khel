import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: books } = await supabase.from('books').select('*').order('title')

  const typeColor: Record<string,string> = { textbook:'bg-green-50 text-green-700 border-green-100', reference:'bg-sky-50 text-sky-700 border-sky-100', guide:'bg-purple-50 text-purple-700 border-purple-100' }

  const byClass = Array.from(new Set((books||[]).map(b => b.class) as string[])).sort()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Library</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📚 School Library</h1>
        <p className="text-slate-500 mb-8">{books?.length || 0} books available in our library</p>

        {!books?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-slate-400 font-semibold">Library catalogue coming soon</p>
          </div>
        ) : (
          <div className="space-y-8">
            {byClass.map(cls => (
              <div key={cls}>
                <h2 className="font-display text-xl font-black text-slate-800 mb-4">{cls === 'All' ? '📖 General Books' : `📚 Class ${cls}`}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {books.filter(b => b.class === cls).map(b => (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
                      <div className="w-full h-20 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-3">📖</div>
                      <h3 className="font-black text-slate-800 text-sm leading-snug">{b.title}</h3>
                      <p className="text-slate-500 text-xs mt-1">{b.author}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{b.subject}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${typeColor[b.type]||'bg-slate-50 text-slate-600 border-slate-100'}`}>{b.type}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${b.available_copies > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {b.available_copies > 0 ? `${b.available_copies} available` : 'All issued'}
                        </span>
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
