export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [
  { n:1, time:'08:00–08:45' },{ n:2, time:'08:45–09:30' },{ n:3, time:'09:30–10:15' },
  { n:4, time:'10:30–11:15' },{ n:5, time:'11:15–12:00' },{ n:6, time:'12:00–12:45' },
  { n:7, time:'13:30–14:15' },{ n:8, time:'14:15–15:00' },
]
const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics':'bg-blue-50 text-blue-800 border-blue-200','Physics':'bg-purple-50 text-purple-800 border-purple-200',
  'Chemistry':'bg-green-50 text-green-800 border-green-200','Biology':'bg-emerald-50 text-emerald-800 border-emerald-200',
  'English':'bg-amber-50 text-amber-800 border-amber-200','Urdu':'bg-rose-50 text-rose-800 border-rose-200',
  'Islamiat':'bg-teal-50 text-teal-800 border-teal-200','Pakistan Studies':'bg-orange-50 text-orange-800 border-orange-200',
  'Computer':'bg-sky-50 text-sky-800 border-sky-200',
}
function getColor(subject: string) { return SUBJECT_COLORS[subject] || 'bg-indigo-50 text-indigo-800 border-indigo-200' }

export default async function TimetablePage() {
  const supabase = createClient()
  const { data: entries } = await supabase.from('timetable').select('*').eq('section','A').order('day').order('period')
  const CLASSES = ['6','7','8','9','10']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm hidden sm:block" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/ Timetable</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📅 Class Timetable</h1>
        <p className="text-slate-500 mb-8">Weekly schedule for all classes at GHS Babi Khel</p>

        {!entries?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📅</div><p className="text-slate-400 font-semibold">Timetable not yet published by admin</p>
          </div>
        ) : (
          <div className="space-y-10">
            {CLASSES.map(cls => {
              const clsEntries = entries.filter(e => e.class === cls)
              if (clsEntries.length === 0) return null
              return (
                <div key={cls} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
                    <div>
                      <h2 className="font-display font-black text-white text-lg">Class {cls}</h2>
                      <p className="text-white/40 text-xs">{clsEntries.length} periods · GHS Babi Khel</p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from(new Set(clsEntries.map(e=>e.subject) as string[])).slice(0,3).map(s => (
                        <span key={s} className={`text-xs font-bold px-2 py-1 rounded-lg border ${getColor(s)}`}>{s.slice(0,4)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{minWidth:'700px'}}>
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider w-32">Period / Time</th>
                          {DAYS.map(d => <th key={d} className="text-center px-3 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">{d.slice(0,3)}<span className="hidden md:inline">{d.slice(3)}</span></th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {PERIODS.map(p => {
                          const rowEntries = DAYS.map(day => clsEntries.find(e => e.day === day && e.period === p.n))
                          if (rowEntries.every(e => !e)) return null
                          return (
                            <tr key={p.n} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-2.5 border-r border-slate-100">
                                <div className="text-xs font-black text-slate-700">P{p.n}</div>
                                <div className="text-xs text-slate-400">{p.time}</div>
                              </td>
                              {DAYS.map(day => {
                                const e = clsEntries.find(e => e.day === day && e.period === p.n)
                                return (
                                  <td key={day} className="px-2 py-2 border-r border-slate-50 last:border-0">
                                    {e ? (
                                      <div className={`rounded-xl border px-2.5 py-2 ${getColor(e.subject)}`}>
                                        <div className="text-xs font-black leading-tight">{e.subject}</div>
                                        {e.teacher_name && <div className="text-xs opacity-60 mt-0.5 truncate">👤 {e.teacher_name}</div>}
                                      </div>
                                    ) : <div className="text-slate-200 text-center text-xs">—</div>}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
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
