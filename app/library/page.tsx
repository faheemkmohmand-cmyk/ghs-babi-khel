import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: books } = await supabase.from('books').select('*').order('subject').order('title')
  const subjects = Array.from(new Set((books||[]).map(b => b.subject) as string[])).sort()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm hidden sm:block" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/ Library</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-slate-800 mb-1">📚 School Library</h1>
          <p className="text-slate-500">{books?.length || 0} books available · Grouped by subject</p>
        </div>
        {!books?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📚</div><p className="text-slate-400 font-semibold">Library catalogue coming soon</p>
          </div>
        ) : (
          <div className="space-y-10">
            {subjects.map(subject => (
              <div key={subject}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-xl font-black text-slate-800">{subject || 'General'}</h2>
                  <div className="flex-1 h-px bg-slate-200"/>
                  <span className="text-xs text-slate-400 font-bold">{books.filter(b=>b.subject===subject).length} books</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {books.filter(b => b.subject === subject).map(b => (
                    <div key={b.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                      <div className={`h-24 flex items-center justify-center text-4xl ${
                        b.type==='textbook'?'bg-gradient-to-br from-green-50 to-emerald-100':
                        b.type==='reference'?'bg-gradient-to-br from-sky-50 to-blue-100':
                        'bg-gradient-to-br from-purple-50 to-violet-100'
                      }`}>📖</div>
                      <div className="p-3">
                        <h3 className="font-black text-slate-800 text-sm leading-snug line-clamp-2">{b.title}</h3>
                        <p className="text-slate-500 text-xs mt-1">{b.author}</p>
                        {b.class && b.class !== 'All' && <p className="text-slate-400 text-xs mt-0.5">Class {b.class}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            b.type==='textbook'?'bg-green-50 text-green-700':
                            b.type==='reference'?'bg-sky-50 text-sky-700':'bg-purple-50 text-purple-700'
                          }`}>{b.type}</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${b.available_copies>0?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>
                            {b.available_copies>0 ? `${b.available_copies} avail.` : 'Issued'}
                          </span>
                        </div>
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
