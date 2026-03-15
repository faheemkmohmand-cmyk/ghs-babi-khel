'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'


const SUBJECTS_BY_CLASS: Record<string,string[]> = {
  '6':  ['Urdu','English','Mathematics','General Science','Social Studies','Islamiat'],
  '7':  ['Urdu','English','Mathematics','General Science','Social Studies','Islamiat'],
  '8':  ['Urdu','English','Mathematics','General Science','Social Studies','Islamiat'],
  '9':  ['Urdu','English','Mathematics','Physics','Chemistry','Biology','Islamiat','Pakistan Studies'],
  '10': ['Urdu','English','Mathematics','Physics','Chemistry','Biology','Islamiat','Pakistan Studies'],
}

function calcGrade(pct: number) {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

type SubjectMark = { name:string; total:number; obtained:number; grade:string }
type Result = {
  id:string; student_id?:string; student_name:string; class:string; section:string
  roll_no?:string; exam_name:string; year:string; subjects:SubjectMark[]
  total_marks:number; obtained_marks:number; percentage:number; grade:string; result:string
}
type Student = { id:string; full_name:string; class:string; section:string; roll_no:string }

export default function ResultsClient({ initialResults, students }: { initialResults:Result[]; students:Student[] }) {
  const supabase = createClient()

  const [results, setResults]     = useState<Result[]>(initialResults)
  const [showModal, setShowModal] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [filterExam, setFilterExam]   = useState('')
  const [selStudentId, setSelStudentId] = useState('')
  const [examName, setExamName]   = useState('Annual Examination')
  const [year, setYear]           = useState(new Date().getFullYear().toString())
  const [marks, setMarks]         = useState<Record<string,number>>({})
  const [saving, setSaving]       = useState(false)

  const selStudent = students.find(s => s.id === selStudentId)
  const subjects   = selStudent ? (SUBJECTS_BY_CLASS[selStudent.class] || SUBJECTS_BY_CLASS['9']) : []
  const exams      = (results.map(r => r.exam_name).filter((v:any,i:number,a:any[])=>a.indexOf(v)===i)
  const filtered   = results.filter(r =>
    (!filterClass || r.class === filterClass) &&
    (!filterExam  || r.exam_name === filterExam)
  )

  function setMark(sub: string, val: string) {
    const n = Math.min(100, Math.max(0, Number(val) || 0))
    setMarks(prev => ({ ...prev, [sub]: n }))
  }

  function computeResult() {
    if (!selStudent || subjects.length === 0) return null
    const subjectMarks: SubjectMark[] = subjects.map(s => {
      const obtained = marks[s] ?? 0
      return { name: s, total: 100, obtained, grade: calcGrade(obtained) }
    })
    const totalMarks    = subjects.length * 100
    const obtainedMarks = subjectMarks.reduce((a, b) => a + b.obtained, 0)
    const percentage    = Math.round((obtainedMarks / totalMarks) * 10000) / 100
    const grade         = calcGrade(percentage)
    const passed        = subjectMarks.every(s => s.obtained >= 33)
    return { subjectMarks, totalMarks, obtainedMarks, percentage, grade, passed }
  }

  function openAdd() {
    setSelStudentId('')
    setMarks({})
    setExamName('Annual Examination')
    setYear(new Date().getFullYear().toString())
    setShowModal(true)
  }

  async function handleSave() {
    if (!selStudentId || !examName) { toast.error('Select student and exam'); return }
    const calc = computeResult()
    if (!calc) return
    setSaving(true)
    try {
      const payload = {
        student_id:    selStudentId,
        student_name:  selStudent!.full_name,
        class:         selStudent!.class,
        section:       selStudent!.section,
        roll_no:       selStudent!.roll_no,
        exam_name:     examName,
        year,
        subjects:      calc.subjectMarks,
        total_marks:   calc.totalMarks,
        obtained_marks: calc.obtainedMarks,
        percentage:    calc.percentage,
        grade:         calc.grade,
        result:        calc.passed ? 'Pass' : 'Fail',
      }
      const { data, error } = await (supabase as any).from('results').insert(payload).select().single()
      if (error) { toast.error(error.message); return }
      setResults(prev => [data, ...prev])
      toast.success(`Result saved for ${selStudent!.full_name} ✅`)
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this result?')) return
    await (supabase as any).from('results').delete().eq('id', id)
    setResults(prev => prev.filter(r => r.id !== id))
    toast.success('Deleted')
  }

  const calc = computeResult()

  const inp = "w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white transition-colors"

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📈 Exam Results</h1>
          <p className="text-slate-500 text-sm">{results.length} results · {students.length} students available</p>
        </div>
        <button onClick={openAdd}
          className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ Add Result
        </button>
      </div>

      {students.length === 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-black text-amber-800">No students added yet</p>
            <p className="text-amber-700 text-sm">Go to <a href="/admin/students" className="underline font-bold">Admin → Students</a> and add students first before adding results.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-3">
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className={inp + " w-auto"}>
          <option value="">All Classes</option>
          {['6','7','8','9','10'].map(c=><option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterExam} onChange={e=>setFilterExam(e.target.value)} className={inp + " w-auto"}>
          <option value="">All Exams</option>
          {exams.map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-slate-400 text-sm font-semibold self-center">{filtered.length} results</span>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                {['#','Student','Class','Exam','Year','Marks','%','Grade','Result',''].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-slate-400">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="font-semibold">No results yet. Click ➕ Add Result to start.</p>
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-black ${i===0?'text-amber-500':i===1?'text-slate-400':i===2?'text-amber-700':'text-slate-300'}`}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 text-sm">{r.student_name}</div>
                    {r.roll_no && <div className="text-xs text-slate-400">Roll {r.roll_no}</div>}
                  </td>
                  <td className="px-4 py-3"><span className="bg-slate-800 text-white text-xs font-black px-2.5 py-1 rounded-lg">Class {r.class}{r.section}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-32"><p className="truncate">{r.exam_name}</p></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.year}</td>
                  <td className="px-4 py-3 text-sm font-bold">{r.obtained_marks}/{r.total_marks}</td>
                  <td className="px-4 py-3">
                    <span className={`font-black text-sm ${r.percentage>=60?'text-green-700':r.percentage>=40?'text-amber-600':'text-red-600'}`}>{r.percentage}%</span>
                  </td>
                  <td className="px-4 py-3"><span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1 rounded-lg">{r.grade}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${r.result==='Pass'?'bg-green-50 text-green-700 border-green-200':'bg-red-50 text-red-600 border-red-200'}`}>{r.result}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={()=>handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Result Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>📈 Add Exam Result</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-5">

              {/* Student selector */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Student *</label>
                <select value={selStudentId} onChange={e => setSelStudentId(e.target.value)} className={inp}>
                  <option value="">-- Select Student --</option>
                  {['6','7','8','9','10'].map(cls => {
                    const classStudents = students.filter(s => s.class === cls)
                    if (classStudents.length === 0) return null
                    return (
                      <optgroup key={cls} label={`── Class ${cls} ──`}>
                        {classStudents.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name} — Roll {s.roll_no} · {cls}{s.section}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Name *</label>
                  <select value={examName} onChange={e => setExamName(e.target.value)} className={inp}>
                    <option>Annual Examination</option>
                    <option>Half-Yearly Examination</option>
                    <option>First Term Exam</option>
                    <option>Second Term Exam</option>
                    <option>Monthly Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
                  <input value={year} onChange={e => setYear(e.target.value)} placeholder="2025" className={inp}/>
                </div>
              </div>

              {/* Marks entry */}
              {selStudent && (
                <>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                      Enter Marks for {selStudent.full_name} — Class {selStudent.class} (out of 100 each)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {subjects.map(sub => (
                        <div key={sub} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border-2 border-slate-100">
                          <label className="flex-1 text-sm font-bold text-slate-700">{sub}</label>
                          <input
                            type="number" min={0} max={100}
                            value={marks[sub] ?? ''}
                            onChange={e => setMark(sub, e.target.value)}
                            placeholder="0"
                            className="w-16 text-center border-2 border-slate-200 rounded-lg px-2 py-1.5 text-sm font-black outline-none focus:border-green-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {calc && (
                    <div className={`rounded-2xl p-4 border-2 ${calc.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Live Result Preview</p>
                          <p className="font-black text-2xl text-slate-800">{calc.obtainedMarks}/{calc.totalMarks}</p>
                          <p className="text-slate-600 font-bold">{calc.percentage}% — Grade {calc.grade}</p>
                        </div>
                        <div className={`text-2xl font-black px-6 py-3 rounded-2xl ${calc.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                          {calc.passed ? '✅ PASS' : '❌ FAIL'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !selStudentId}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '💾 Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
