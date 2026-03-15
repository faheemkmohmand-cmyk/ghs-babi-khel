export const revalidate = 0

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function TeachersPage() {
  const supabase = createClient()
  const { data: logoData } = await supabase.from('school_settings').select('logo_url').order('updated_at', { ascending: false }).limit(1)
  const logoUrl = logoData?.[0]?.logo_url || ''
  const { data: teachers } = await supabase.from('teachers').select('*').eq('status','active').order('full_name')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy-900/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">{logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full"/> : '🏫'}</div>
            <span className="font-display font-bold text-white text-sm">GHS Babi Khel</span>
          </Link>
          <Link href="/" className="text-white/40 hover:text-white text-sm font-semibold transition-colors">← Home</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-navy-800 mb-2">👨‍🏫 Our Teachers</h1>
          <p className="text-slate-500">Meet the dedicated faculty of Government High School Babi Khel</p>
        </div>

        {!teachers?.length ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-3">👨‍🏫</div>
            <p className="text-slate-500 font-semibold">Teacher profiles coming soon</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teachers.map(t=>(
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:shadow-md transition-all">
                {t.photo_url
                  ?<img src={t.photo_url} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-slate-100" alt=""/>
                  :<div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white font-black text-xl mx-auto mb-3">{t.full_name?.[0]?.toUpperCase()}</div>}
                <p className="font-black text-navy-800">{t.full_name}</p>
                <p className="text-green-900 text-sm font-bold mt-0.5">{t.subject}</p>
                {t.qualification&&<p className="text-slate-400 text-xs mt-0.5">{t.qualification}</p>}
                {t.experience_years>0&&<p className="text-slate-400 text-xs">{t.experience_years} yrs experience</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
