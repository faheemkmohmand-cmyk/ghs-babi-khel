'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CLASSES = ['6','7','8','9','10']
const SUBJECTS_BY_CLASS: Record<string,string[]> = {
  '6':['Urdu','English','Mathematics','General Science','Islamiat','Social Studies'],
  '7':['Urdu','English','Mathematics','General Science','Islamiat','Social Studies'],
  '8':['Urdu','English','Mathematics','General Science','Islamiat','Pakistan Studies'],
  '9':['Urdu','English','Mathematics','Physics','Chemistry','Biology','Islamiat','Pakistan Studies'],
  '10':['Urdu','English','Mathematics','Physics','Chemistry','Biology','Islamiat','Pakistan Studies'],
}
function getGrade(pct:number) {
  if(pct>=90) return 'A+'
  if(pct>=80) return 'A'
  if(pct>=70) return 'B'
  if(pct>=60) return 'C'
  if(pct>=50) return 'D'
  return 'F'
}
type Student = { id:string; full_name:string; class:string; section:string; roll_no:string }
type SubjectMark = { subject:string; total:number; obtained:number }

export default function AdminResultsPage() {
  const [selClass, setSelClass] = useState('9')
  const [students, setStudents] = useState<Student[]>([])
  const [selStudent, setSelStudent] = useState<Student|null>(null)
  const [examName, setExamName] = useState('Annual Examination 2025')
  const [year, setYear] = useState('2025')
  const [marks, setMarks] = useState<SubjectMark[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<{full_name:string}|null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id',user.id).single()
      if (!p||p.role!=='admin') { window.location.href='/dashboard'; return }
      setProfile(p)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    async function loadStudents() {
      const { data } = await supabase.from('students').select('id,full_name,class,section,roll_no').eq('class',selClass).eq('status','active').order('roll_no')
      setStudents(data||[])
      setSelStudent(null)
      setMarks([])
    }
    loadStudents()
  }, [selClass])

  function selectStudent(s:Student) {
    setSelStudent(s)
    setMarks(SUBJECTS_BY_CLASS[s.class]?.map(sub=>({subject:sub,total:100,obtained:0}))||[])
  }

  const total = marks.reduce((a,m)=>a+m.total,0)
  const obtained = marks.reduce((a,m)=>a+m.obtained,0)
  const pct = total>0 ? Math.round((obtained/total)*100*100)/100 : 0
  const grade = getGrade(pct)
  const result = pct>=40?'Pass':'Fail'

  async function handleSave() {
    if (!selStudent) { toast.error('Select a student first'); return }
    if (!examName) { toast.error('Enter exam name'); return }
    if (marks.some(m=>m.obtained>m.total)) { toast.error('Obtained marks cannot exceed total marks'); return }
    setSaving(true)
    try {
      const payload = {
        student_id: selStudent.id,
        student_name: selStudent.full_name,
        class: selStudent.class,
        section: selStudent.section,
        roll_no: selStudent.roll_no,
        exam_name: examName,
        year,
        subjects: marks,
        total_marks: total,
        obtained_marks: obtained,
        percentage: pct,
        grade,
        result,
      }
      const { error } = await supabase.from('results').upsert(payload,{onConflict:'student_id,exam_name,year'})
      if (error) { toast.error(error.message); return }
      toast.success(`Result saved for ${selStudent.full_name} ✅`)
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full spinner mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-slate-800 text-sm">Results</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📊 Enter Results</h1>
            <p className="text-slate-500 text-sm mt-0.5">Select a student and enter marks</p>
          </div>
          <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - student picker */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Class</label>
              <div className="flex flex-wrap gap-1.5">
                {CLASSES.map(c=>(
                  <button key={c} onClick={()=>setSelClass(c)} className={`px-3 py-1.5 rounded-xl text-sm font-black border-2 transition-all ${selClass===c?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-3 border-b border-slate-50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Students — Class {selClass}</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {students.length===0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No students in Class {selClass}</p>
                ) : students.map(s=>(
                  <button key={s.id} onClick={()=>selectStudent(s)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 transition-colors hover:bg-slate-50 ${selStudent?.id===s.id?'bg-green-50 border-l-4 border-l-green-900':''}`}>
                    <p className="font-bold text-slate-800 text-sm">{s.full_name}</p>
                    <p className="text-xs text-slate-400">Roll {s.roll_no} · {s.class}{s.section}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right - marks entry */}
          <div className="lg:col-span-2">
            {!selStudent ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 h-80 flex items-center justify-center">
                <div className="text-center"><div className="text-4xl mb-2">👈</div><p className="text-slate-400 font-semibold">Select a student to enter marks</p></div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-white font-black">{selStudent.full_name?.[0]}</div>
                    <div>
                      <p className="font-black text-slate-800">{selStudent.full_name}</p>
                      <p className="text-xs text-slate-400">Class {selStudent.class}{selStudent.section} · Roll {selStudent.roll_no}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Name</label>
                      <input value={examName} onChange={e=>setExamName(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors"/>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
                      <input value={year} onChange={e=>setYear(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-500 transition-colors"/>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Subject</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest w-24">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest w-24">Obtained</th>
                        <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest w-16">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((m,i)=>{
                        const subPct = m.total>0?Math.round((m.obtained/m.total)*100):0
                        return (
                          <tr key={m.subject} className={`border-t border-slate-50 ${i%2===0?'':'bg-slate-50/40'}`}>
                            <td className="px-4 py-2.5 font-bold text-slate-700 text-sm">{m.subject}</td>
                            <td className="px-4 py-2.5 text-center">
                              <input type="number" min={0} max={200} value={m.total} onChange={e=>setMarks(prev=>prev.map((x,j)=>j===i?{...x,total:Number(e.target.value)}:x))}
                                className="w-16 border-2 border-slate-200 rounded-lg px-2 py-1 text-sm text-center outline-none focus:border-green-500 transition-colors"/>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <input type="number" min={0} max={m.total} value={m.obtained} onChange={e=>setMarks(prev=>prev.map((x,j)=>j===i?{...x,obtained:Number(e.target.value)}:x))}
                                className={`w-16 border-2 rounded-lg px-2 py-1 text-sm text-center outline-none transition-colors ${m.obtained>m.total?'border-red-400 bg-red-50':'border-slate-200 focus:border-green-500'}`}/>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-sm font-black ${subPct>=50?'text-green-700':'text-red-600'}`}>{subPct}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Result preview */}
                <div className={`rounded-2xl border-2 p-5 mb-4 flex items-center justify-between flex-wrap gap-4 ${result==='Pass'?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{result==='Pass'?'🏆':'📚'}</span>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Result Preview</p>
                      <p className="font-display text-xl font-black text-slate-800">{obtained}/{total} · {pct}%</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className={`text-center px-4 py-2 rounded-xl font-black text-lg ${result==='Pass'?'bg-green-900 text-white':'bg-red-500 text-white'}`}>{grade}</div>
                    <div className={`text-center px-4 py-2 rounded-xl font-black text-sm ${result==='Pass'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{result}</div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md text-base">
                  {saving&&<span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                  💾 Save Result for {selStudent.full_name}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
