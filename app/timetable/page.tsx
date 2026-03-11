import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
const PERIODS = [
  {num:1,start:'8:00',end:'8:45'},{num:2,start:'8:45',end:'9:30'},
  {num:3,start:'9:30',end:'10:15'},{num:4,start:'10:30',end:'11:15'},
  {num:5,start:'11:15',end:'12:00'},{num:6,start:'12:00',end:'12:45'},
  {num:7,start:'1:30',end:'2:15'},
]
const subjectColors: Record<string,string> = {
  Mathematics:'bg-blue-50 border-blue-200 text-blue-800', Physics:'bg-purple-50 border-purple-200 text-purple-800',
  Chemistry:'bg-green-50 border-green-200 text-green-800', Biology:'bg-emerald-50 border-emerald-200 text-emerald-800',
  English:'bg-rose-50 border-rose-200 text-rose-800', Urdu:'bg-amber-50 border-amber-200 text-amber-800',
  Islamiat:'bg-teal-50 border-teal-200 text-teal-800', 'Pakistan Studies':'bg-orange-50 border-orange-200 text-orange-800',
  'Computer Science':'bg-cyan-50 border-cyan-200 text-cyan-800', 'Physical Education':'bg-red-50 border-red-200 text-red-800',
}

export default async function TimetablePage({ searchParams }: { searchParams: Record<string,string> }) {
  const supabase = createClient()
  const selClass = searchParams.class||'9'
  const selSection = searchParams.section||'A'
  const { data: slots } = await supabase.from('timetable').select('*,teachers(full_name)').eq('class',selClass).eq('section',selSection)

  function getSlot(day:string,period:number) {
    return slots?.find(s=>s.day===day&&s.period===period)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy-900/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</div>
            <span className="font-display font-bold text-white text-sm">GHS Babi Khel</span>
          </Link>
          <Link href="/" className="text-white/40 hover:text-white text-sm font-semibold transition-colors">← Home</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-black text-navy-800 mb-2">📅 Class Timetable</h1>
          <p className="text-slate-500">Weekly schedule — GHS Babi Khel</p>
        </div>

        {/* Class/Section Selector */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Class</p>
            <div className="flex gap-1.5">
              {['6','7','8','9','10'].map(c=>(
                <Link key={c} href={`/timetable?class=${c}&section=${selSection}`}
                  className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${selClass===c?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{c}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Section</p>
            <div className="flex gap-1.5">
              {['A','B','C'].map(s=>(
                <Link key={s} href={`/timetable?class=${selClass}&section=${s}`}
                  className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${selSection===s?'bg-green-900 text-white border-green-900':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{s}</Link>
              ))}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="font-black text-navy-800">Class {selClass} · Section {selSection}</p>
            <p className="text-slate-400 text-sm">GHS Babi Khel</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-white/60 w-24">Period</th>
                  {DAYS.map(d=><th key={d} className="px-3 py-3 text-center text-xs font-black uppercase tracking-widest text-white">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p,pi)=>(
                  <tr key={p.num} className={pi%2===0?'bg-white':'bg-slate-50/40'}>
                    <td className="px-4 py-3 border-b border-slate-50">
                      <div className="font-black text-slate-700 text-sm">P{p.num}</div>
                      <div className="text-xs text-slate-400">{p.start}–{p.end}</div>
                    </td>
                    {DAYS.map(day=>{
                      const slot = getSlot(day,p.num)
                      const color = slot?subjectColors[slot.subject]||'bg-slate-50 border-slate-200 text-slate-700':''
                      return (
                        <td key={day} className="px-2 py-2 border-b border-l border-slate-100">
                          {slot?(
                            <div className={`rounded-xl p-2 border-2 min-h-[56px] ${color}`}>
                              <div className="font-black text-xs leading-tight">{slot.subject}</div>
                              {(slot as any).teachers&&<div className="text-xs opacity-60 mt-0.5 truncate">{(slot as any).teachers.full_name.split(' ').slice(-1)[0]}</div>}
                            </div>
                          ):(
                            <div className="min-h-[56px] rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                              <span className="text-slate-200 text-xs">—</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="bg-white border border-slate-100 rounded-lg px-3 py-1.5">⏸️ Break after Period 3 (10:15–10:30)</span>
          <span className="bg-white border border-slate-100 rounded-lg px-3 py-1.5">🕐 Lunch after Period 6 (12:45–1:30)</span>
        </div>
      </div>
    </div>
  )
}
