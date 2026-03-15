import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeachersPage() {
  const supabase = createClient()
  const { data: settings } = await (supabase as any).from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
  const { data: teachers } = await (supabase as any).from('teachers').select('*').eq('status','active').order('full_name')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Our Teachers</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>👨‍🏫 Our Teachers</h1>
        <p className="text-slate-500 mb-8">Qualified and dedicated faculty at GHS Babi Khel</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {teachers?.length ? teachers.map(t=>(
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:shadow-md transition-all">
              {t.photo_url
                ? <img src={t.photo_url} className="w-20 h-20 rounded-full object-cover mx-auto mb-3" alt="" />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-3" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>{t.full_name?.[0]}</div>
              }
              <h3 className="font-black text-slate-800">{t.full_name}</h3>
              <p className="text-green-900 text-sm font-bold mt-0.5">{t.subject}</p>
              <p className="text-slate-400 text-xs mt-0.5">{t.role}</p>
              {t.qualification && <p className="text-slate-400 text-xs">{t.qualification}</p>}
            </div>
          )) : (
            <div className="col-span-4 text-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="text-5xl mb-3">👨‍🏫</div>
              <p className="text-slate-400 font-semibold">Teachers will appear here once added</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
