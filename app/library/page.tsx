import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: settings } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
  const { data: books } = await supabase.from('books').select('*').order('subject').order('title')

  const subjects = Array.from(new Set(books?.map(b=>b.subject)||[]))
  const stats = {
    total: books?.length||0,
    textbooks: books?.filter(b=>b.type==='textbook').length||0,
    available: books?.filter(b=>b.available_copies>0).length||0,
    totalCopies: books?.reduce((a,b)=>a+b.total_copies,0)||0,
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
        <span className="text-white/30 ml-2">/ Library</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="rounded-3xl p-8 text-white mb-8" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
          <h1 className="text-3xl font-black mb-2" style={{fontFamily:'Georgia,serif'}}>📚 School Library</h1>
          <p className="text-white/60 mb-6">Government High School Babi Khel — Library Catalogue</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {num:stats.total,label:'Books Listed'},
              {num:stats.totalCopies,label:'Total Copies'},
              {num:stats.textbooks,label:'Textbooks'},
              {num:stats.available,label:'Available'},
            ].map(s=>(
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black">{s.num}</div>
                <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Books by subject */}
        {subjects.length===0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-slate-500 font-semibold">Library catalogue coming soon</p>
          </div>
        ) : subjects.map(subject => {
          const subBooks = books?.filter(b=>b.subject===subject)||[]
          return (
            <div key={subject} className="mb-6">
              <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-green-900 inline-block"/>
                {subject}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subBooks.map(b=>(
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-800 text-sm leading-snug">{b.title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{b.author}</p>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg flex-shrink-0 ${b.type==='textbook'?'bg-blue-50 text-blue-700':b.type==='reference'?'bg-purple-50 text-purple-700':'bg-green-50 text-green-700'}`}>{b.type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-400">Class {b.class==='All'?'All':b.class}</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${b.available_copies>0?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
                        {b.available_copies>0?`${b.available_copies} available`:'All issued'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
