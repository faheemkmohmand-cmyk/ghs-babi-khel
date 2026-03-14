export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const FILE_ICONS: Record<string, string> = { pdf:'📄', docx:'📝', doc:'📝', pptx:'📊', xlsx:'📊', jpg:'🖼️', png:'🖼️', other:'📁' }
const FILE_COLORS: Record<string, string> = {
  pdf:'bg-red-50 text-red-700 border-red-200',
  docx:'bg-blue-50 text-blue-700 border-blue-200',
  doc:'bg-blue-50 text-blue-700 border-blue-200',
  pptx:'bg-orange-50 text-orange-700 border-orange-200',
}
function fileColor(type: string) { return FILE_COLORS[type] || 'bg-slate-50 text-slate-700 border-slate-200' }

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: resources } = await supabase
    .from('library_resources').select('*').eq('published', true).order('category').order('created_at', { ascending: false })

  const categories = Array.from(new Set((resources || []).map(r => r.category) as string[]))

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 text-white px-4 py-3 flex items-center gap-3 shadow-lg" style={{ background: '#0a1628' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#014d26,#4ade80)' }}>🏫</div>
          <span className="font-bold text-sm hidden sm:block">GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white font-bold text-sm">Library</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black text-slate-800 mb-2">📚 Digital Library</h1>
          <p className="text-slate-500">{resources?.length || 0} resources — Download books, notes, past papers & more</p>
        </div>

        {!resources?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-slate-500 font-bold text-lg">Library coming soon</p>
            <p className="text-slate-400 text-sm mt-1">Books and notes will be added by admin</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(cat => {
              const catResources = (resources || []).filter(r => r.category === cat)
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-display text-xl font-black text-slate-800">{cat}</h2>
                    <div className="flex-1 h-px bg-slate-200"/>
                    <span className="text-xs text-slate-400 font-bold">{catResources.length} files</span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catResources.map(r => (
                      <div key={r.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5">
                        {/* File type banner */}
                        <div className={`px-4 py-3 flex items-center gap-3 border-b ${fileColor(r.file_type)}`}>
                          <span className="text-2xl">{FILE_ICONS[r.file_type] || '📁'}</span>
                          <div>
                            <span className="text-xs font-black uppercase">{r.file_type}</span>
                            {r.file_size && <span className="text-xs opacity-60 ml-2">{r.file_size}</span>}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black text-slate-800 text-sm leading-snug mb-1">{r.title}</h3>
                          {r.description && <p className="text-slate-400 text-xs line-clamp-2 mb-3">{r.description}</p>}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {r.class !== 'All' && (
                              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-lg">Class {r.class}</span>
                            )}
                            {r.subject && r.subject !== 'All Subjects' && (
                              <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-lg">{r.subject}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <a href={r.file_url} target="_blank" rel="noreferrer"
                              className="flex-1 text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all">
                              👁 View
                            </a>
                            <a href={r.file_url} download target="_blank" rel="noreferrer"
                              className="flex-1 text-center bg-green-900 hover:bg-green-950 text-white font-bold py-2 rounded-xl text-xs transition-all">
                              ⬇️ Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
