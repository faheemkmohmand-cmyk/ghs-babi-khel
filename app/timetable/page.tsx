import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']

export default async function TimetablePage() {
  const supabase = createClient()
  const { data: entries } = await supabase.from('timetable').select('*').order('day').order('period')

  const classes = [...new Set((entries || []).map(e => `${e.class}${e.section}`))]
    .sort((a, b) => a.localeCompare(b))

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Timetable</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">📅 Class Timetable</h1>
        <p className="text-slate-500 mb-8">Weekly schedule for all classes</p>

        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-slate-400 font-semibold">Timetable not yet published</p>
          </div>
        ) : (
          <div className="space-y-8">
            {classes.map(cls => {
              const clsEntries = (entries || []).filter(e => `${e.class}${e.section}` === cls)
              return (
                <div key={cls} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-900 to-green-950 px-5 py-3">
                    <h2 className="font-display font-black text-white">Class {cls}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase">Period</th>
                          {DAYS.map(d => <th key={d} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase whitespace-nowrap">{d}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[1,2,3,4,5,6,7,8].map(period => {
                          const row = DAYS.map(day => clsEntries.find(e => e.day === day && e.period === period))
                          if (row.every(r => !r)) return null
                          return (
                            <tr key={period} className="hover:bg-slate-50">
                              <td className="px-4 py-3"><span className="w-7 h-7 rounded-full bg-green-100 text-green-800 text-xs font-black flex items-center justify-center">{period}</span></td>
                              {DAYS.map(day => {
                                const e = clsEntries.find(e => e.day === day && e.period === period)
                                return (
                                  <td key={day} className="px-4 py-3">
                                    {e ? (
                                      <div>
                                        <p className="font-bold text-slate-800 text-sm">{e.subject}</p>
                                        <p className="text-slate-400 text-xs">{e.start_time}–{e.end_time}</p>
                                      </div>
                                    ) : <span className="text-slate-200">—</span>}
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
