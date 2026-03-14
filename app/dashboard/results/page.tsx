'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function MyResultsPage() {
  const [student, setStudent]   = useState<any>(null)
  const [results, setResults]   = useState<any[]>([])
  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      setProfile(profile)
      const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle()
      setStudent(student)
      if (student) {
        const { data: results } = await supabase.from('results').select('*').eq('student_id', student.id).order('created_at', {ascending:false})
        setResults(results || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-slate-500 font-semibold">Loading results...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-bold text-slate-800 text-sm">My Results</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📊 My Results</h1>
            {student && <p className="text-slate-500 text-sm mt-0.5">Class {student.class}{student.section} · Roll {student.roll_no}</p>}
          </div>
          <Link href="/dashboard" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Dashboard</Link>
        </div>

        {!student ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="font-black text-slate-800 text-xl mb-2">Profile Not Linked</h3>
            <p className="text-slate-500">Contact your admin to link your student profile.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="font-black text-slate-800 text-xl mb-2">No Results Yet</h3>
            <p className="text-slate-500">Results will appear here after exams.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r:any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 flex items-center justify-between flex-wrap gap-3" style={{background:'linear-gradient(135deg,#0a1628,#014d26)'}}>
                  <div>
                    <p className="text-white/50 text-xs font-bold uppercase mb-1">{r.exam_name}</p>
                    <p className="text-white font-black text-lg">{r.obtained_marks}/{r.total_marks} marks</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{r.percentage}%</div>
                    <div className={`text-sm font-black ${r.result === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>{r.result} · Grade {r.grade}</div>
                  </div>
                </div>
                {r.subjects?.length > 0 && (
                  <div className="p-5">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Subject-wise</p>
                    <div className="space-y-2">
                      {(r.subjects as any[]).map((s:any, i:number) => {
                        const pct = s.total > 0 ? Math.round((s.obtained/s.total)*100) : 0
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-28 text-sm font-bold text-slate-700 flex-shrink-0 truncate">{s.subject}</div>
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${pct >= 50 ? 'bg-green-600' : 'bg-red-400'}`} style={{width:`${pct}%`}}/>
                            </div>
                            <div className="text-sm font-black text-slate-600 w-20 text-right flex-shrink-0">{s.obtained}/{s.total}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
