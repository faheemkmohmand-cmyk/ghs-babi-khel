'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type ClassResult = { id: string; class: string; exam_name: string; exam_type: string; year: string; total_students: number; pass_students: number; published: boolean }
type StudentResult = { id: string; class_result_id: string; student_name: string; roll_no: string; obtained_marks: number; total_marks: number; percentage: number; rank: number; status: string; remarks: string }

const MIDDLE = ['6','7','8']
const HIGH   = ['9','10']
const ALL_CLASSES = [...MIDDLE, ...HIGH]
const REMARKS_OPTIONS = ['Excellent','Very Good','Good','Satisfactory','Needs Improvement','Fail']

function calcPct(obtained: number, total: number) {
  if (!total) return 0
  return Math.round((obtained / total) * 100 * 100) / 100
}

function autoRemark(pct: number, status: string) {
  if (status === 'fail') return 'Fail'
  if (pct >= 90) return 'Excellent'
  if (pct >= 80) return 'Very Good'
  if (pct >= 65) return 'Good'
  if (pct >= 50) return 'Satisfactory'
  return 'Needs Improvement'
}

export default function AdminResultsPage() {
  const supabase = createClient()
  const [classResults, setClassResults] = useState<ClassResult[]>([])
  const [students, setStudents] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selResult, setSelResult] = useState<ClassResult | null>(null)
  const [showExamForm, setShowExamForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingStudents, setSavingStudents] = useState(false)
  const [filterClass, setFilterClass] = useState('all')
  const [examForm, setExamForm] = useState({ class: '6', exam_name: '1st Semester 2026', exam_type: 'semester', year: '2026', total_marks: 500 })
  const [editingStudents, setEditingStudents] = useState<StudentResult[]>([])
  const [bulkRows, setBulkRows] = useState(10)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('class_results').select('*').order('class').order('created_at', { ascending: false })
    setClassResults(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadStudents(cr: ClassResult) {
    setSelResult(cr)
    const { data } = await supabase.from('student_results').select('*').eq('class_result_id', cr.id).order('rank')
    setStudents(data || [])
    setEditingStudents(data || [])
  }

  async function createExam() {
    if (!examForm.exam_name) { toast.error('Exam name required'); return }
    setSaving(true)
    const isMiddle = MIDDLE.includes(examForm.class)
    const type = isMiddle ? examForm.exam_type : 'annual'
    const { data, error } = await supabase.from('class_results').insert({
      class: examForm.class, exam_name: examForm.exam_name,
      exam_type: type, year: examForm.year,
      total_students: 0, pass_students: 0, published: false
    }).select().single()
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Exam created! Now add students.')
    setShowExamForm(false)
    setClassResults(prev => [data, ...prev])
    loadStudents(data)
  }

  async function deleteExam(cr: ClassResult) {
    if (!confirm(`Delete "${cr.exam_name}" for Class ${cr.class}? All student results will be lost.`)) return
    await supabase.from('student_results').delete().eq('class_result_id', cr.id)
    await supabase.from('class_results').delete().eq('id', cr.id)
    setClassResults(prev => prev.filter(r => r.id !== cr.id))
    if (selResult?.id === cr.id) { setSelResult(null); setStudents([]) }
    toast.success('Deleted')
  }

  async function togglePublish(cr: ClassResult) {
    const { data } = await supabase.from('class_results').update({ published: !cr.published }).eq('id', cr.id).select().single()
    if (data) {
      setClassResults(prev => prev.map(r => r.id === cr.id ? data : r))
      if (selResult?.id === cr.id) setSelResult(data)
      toast.success(data.published ? '✅ Published!' : 'Hidden')
    }
  }

  function addStudentRow() {
    const newRow: StudentResult = {
      id: `new-${Date.now()}`, class_result_id: selResult!.id,
      student_name: '', roll_no: String(editingStudents.length + 1),
      obtained_marks: 0, total_marks: 500, percentage: 0, rank: editingStudents.length + 1,
      status: 'pass', remarks: 'Good'
    }
    setEditingStudents(prev => [...prev, newRow])
  }

  function addBulkRows() {
    const newRows: StudentResult[] = Array.from({ length: bulkRows }, (_, i) => ({
      id: `new-${Date.now()}-${i}`, class_result_id: selResult!.id,
      student_name: '', roll_no: String(editingStudents.length + i + 1),
      obtained_marks: 0, total_marks: 500, percentage: 0, rank: editingStudents.length + i + 1,
      status: 'pass', remarks: 'Good'
    }))
    setEditingStudents(prev => [...prev, ...newRows])
  }

  function updateStudent(idx: number, field: keyof StudentResult, val: any) {
    setEditingStudents(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: val }
      // Auto calculate percentage and remarks when marks change
      if (field === 'obtained_marks' || field === 'total_marks') {
        const obt = field === 'obtained_marks' ? val : updated[idx].obtained_marks
        const tot = field === 'total_marks' ? val : updated[idx].total_marks
        const pct = calcPct(Number(obt), Number(tot))
        updated[idx].percentage = pct
        updated[idx].status = pct >= 33 ? 'pass' : 'fail'
        updated[idx].remarks = autoRemark(pct, updated[idx].status)
      }
      return updated
    })
  }

  function removeRow(idx: number) {
    setEditingStudents(prev => prev.filter((_, i) => i !== idx))
  }

  function autoRank() {
    setEditingStudents(prev => {
      const sorted = [...prev].sort((a, b) => b.obtained_marks - a.obtained_marks)
      return sorted.map((s, i) => ({ ...s, rank: i + 1 }))
    })
    toast.success('Ranks assigned by marks!')
  }

  async function saveAllStudents() {
    if (!selResult) return
    const valid = editingStudents.filter(s => s.student_name.trim())
    if (valid.length === 0) { toast.error('Add at least one student name'); return }
    setSavingStudents(true)
    try {
      // Delete old and reinsert
      await supabase.from('student_results').delete().eq('class_result_id', selResult.id)
      const toInsert = valid.map(s => ({
        class_result_id: selResult.id,
        student_name: s.student_name.trim(),
        roll_no: s.roll_no,
        obtained_marks: Number(s.obtained_marks),
        total_marks: Number(s.total_marks),
        percentage: calcPct(Number(s.obtained_marks), Number(s.total_marks)),
        rank: s.rank,
        status: s.status,
        remarks: s.remarks
      }))
      const { error } = await supabase.from('student_results').insert(toInsert)
      if (error) throw error
      // Update summary
      const passCount = valid.filter(s => s.status === 'pass').length
      await supabase.from('class_results').update({ total_students: valid.length, pass_students: passCount }).eq('id', selResult.id)
      setClassResults(prev => prev.map(r => r.id === selResult.id ? { ...r, total_students: valid.length, pass_students: passCount } : r))
      setStudents(toInsert as any)
      toast.success(`✅ Saved ${valid.length} students!`)
    } catch (e: any) { toast.error(e.message) }
    finally { setSavingStudents(false) }
  }

  const filtered = filterClass === 'all' ? classResults : classResults.filter(r => r.class === filterClass)

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📊 Results Management</h1>
            <p className="text-slate-500 text-sm">Middle (6-8): Semester results · High (9-10): BISE Annual results</p>
          </div>
          <button onClick={() => setShowExamForm(true)}
            className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md">
            ➕ New Exam Result
          </button>
        </div>

        {/* Class filter */}
        <div className="flex flex-wrap gap-2">
          {['all', ...ALL_CLASSES].map(c => (
            <button key={c} onClick={() => setFilterClass(c)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filterClass === c ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}>{c === 'all' ? 'All Classes' : `Class ${c}`}</button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Exam list */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Exams ({filtered.length})</p>
            {loading ? <div className="text-slate-400 text-sm py-8 text-center">Loading...</div>
            : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-slate-400 text-sm font-semibold">No results yet</p>
                <button onClick={() => setShowExamForm(true)} className="mt-2 text-green-700 text-xs font-bold hover:underline">Create first →</button>
              </div>
            ) : filtered.map(cr => (
              <div key={cr.id} onClick={() => loadStudents(cr)}
                className={`cursor-pointer bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                  selResult?.id === cr.id ? 'border-green-900 ring-2 ring-green-900/20' : 'border-slate-100'
                }`}>
                <div className={`px-4 py-2 text-xs font-black text-white ${MIDDLE.includes(cr.class) ? 'bg-blue-600' : 'bg-green-800'}`}>
                  Class {cr.class} · {MIDDLE.includes(cr.class) ? 'Middle' : 'High (BISE)'}
                </div>
                <div className="p-3">
                  <p className="font-black text-slate-800 text-sm leading-snug">{cr.exam_name}</p>
                  <p className="text-slate-400 text-xs mt-1">{cr.total_students} students · {cr.pass_students} passed</p>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={e => { e.stopPropagation(); togglePublish(cr) }}
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${cr.published ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {cr.published ? '✅ Live' : '👁 Hidden'}
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteExam(cr) }}
                      className="text-xs font-bold text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 ml-auto">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Student results editor */}
          <div className="lg:col-span-2">
            {!selResult ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 h-80 flex items-center justify-center">
                <div className="text-center"><div className="text-5xl mb-3">👈</div>
                  <p className="text-slate-500 font-bold">Select an exam to add/edit student results</p></div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3"
                    style={{ background: MIDDLE.includes(selResult.class) ? 'linear-gradient(135deg,#1e3a8a,#3b82f6)' : 'linear-gradient(135deg,#014d26,#16a34a)' }}>
                    <div>
                      <p className="text-white/60 text-xs font-bold uppercase">Class {selResult.class} Results</p>
                      <h2 className="text-white font-black text-lg">{selResult.exam_name}</h2>
                      <p className="text-white/50 text-xs">{editingStudents.filter(s=>s.student_name).length} students · {editingStudents.filter(s=>s.status==='pass'&&s.student_name).length} passing</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={autoRank} className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg">🏆 Auto Rank</button>
                      <button onClick={addStudentRow} className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg">+ Add Row</button>
                    </div>
                  </div>

                  {/* Bulk add */}
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-semibold">Quick add:</span>
                    <select value={bulkRows} onChange={e => setBulkRows(Number(e.target.value))}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none">
                      {[5,10,15,20,25,30,35,40].map(n => <option key={n} value={n}>{n} rows</option>)}
                    </select>
                    <button onClick={addBulkRows} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg">Add {bulkRows} Rows</button>
                    <span className="text-xs text-slate-400 ml-auto">{editingStudents.length} rows total</span>
                  </div>

                  {/* Student table */}
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm" style={{ minWidth: '800px' }}>
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                          {['#','Student Name','Roll No','Obtained','Total','%','Rank','Status','Remarks',''].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs font-black text-slate-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {editingStudents.map((s, idx) => (
                          <tr key={s.id} className={`hover:bg-slate-50 ${s.status === 'fail' ? 'bg-red-50/30' : ''}`}>
                            <td className="px-3 py-2 text-slate-400 text-xs font-bold">{idx + 1}</td>
                            <td className="px-2 py-1.5">
                              <input value={s.student_name} onChange={e => updateStudent(idx, 'student_name', e.target.value)}
                                placeholder="Student name..." className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 min-w-[140px]"/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input value={s.roll_no} onChange={e => updateStudent(idx, 'roll_no', e.target.value)}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400"/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={s.obtained_marks} onChange={e => updateStudent(idx, 'obtained_marks', Number(e.target.value))}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 text-center"/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={s.total_marks} onChange={e => updateStudent(idx, 'total_marks', Number(e.target.value))}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 text-center"/>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-xs font-black ${s.percentage >= 50 ? 'text-green-700' : 'text-red-600'}`}>{s.percentage}%</span>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={s.rank} onChange={e => updateStudent(idx, 'rank', Number(e.target.value))}
                                className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 text-center"/>
                            </td>
                            <td className="px-2 py-1.5">
                              <select value={s.status} onChange={e => updateStudent(idx, 'status', e.target.value)}
                                className={`border rounded-lg px-2 py-1.5 text-xs outline-none font-bold ${s.status === 'pass' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                                <option value="pass">Pass</option>
                                <option value="fail">Fail</option>
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <select value={s.remarks} onChange={e => updateStudent(idx, 'remarks', e.target.value)}
                                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-green-400 bg-white">
                                {REMARKS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 font-black text-lg leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                        {editingStudents.length === 0 && (
                          <tr><td colSpan={10} className="text-center py-12 text-slate-400">
                            <div className="text-3xl mb-2">📝</div>
                            <p>Click "+ Add Row" or "Add Bulk Rows" to start</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Save */}
                  <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
                    <button onClick={saveAllStudents} disabled={savingStudents}
                      className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      {savingStudents && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                      💾 Save All {editingStudents.filter(s => s.student_name).length} Students
                    </button>
                    <button onClick={() => togglePublish(selResult)}
                      className={`px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        selResult.published ? 'border-green-200 text-green-700 bg-green-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      {selResult.published ? '✅ Published' : '🌐 Publish'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Exam Modal */}
      {showExamForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">➕ Create Exam Result</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Class *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CLASSES.map(c => (
                    <button key={c} onClick={() => {
                      setExamForm(p => ({
                        ...p, class: c,
                        exam_type: MIDDLE.includes(c) ? 'semester' : 'annual',
                        exam_name: MIDDLE.includes(c) ? '1st Semester 2026' : 'BISE Peshawar Annual Result 2026'
                      }))
                    }}
                      className={`w-12 h-10 rounded-xl text-sm font-black border-2 transition-all ${
                        examForm.class === c
                          ? MIDDLE.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-green-900 text-white border-green-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}>{c}</button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {MIDDLE.includes(examForm.class) ? '📘 Middle class — 2 semesters available' : '📗 High class — BISE Annual result'}
                </p>
              </div>
              {MIDDLE.includes(examForm.class) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Semester</label>
                  <div className="flex gap-2">
                    {['semester','annual'].map(t => (
                      <button key={t} onClick={() => setExamForm(p => ({ ...p, exam_type: t }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                          examForm.exam_type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'
                        }`}>{t === 'semester' ? '📘 Semester' : '📗 Annual'}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Exam Name *</label>
                <input value={examForm.exam_name} onChange={e => setExamForm(p => ({ ...p, exam_name: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MIDDLE.includes(examForm.class)
                    ? ['1st Semester 2026','2nd Semester 2026','1st Semester 2025','2nd Semester 2025'].map(n => (
                      <button key={n} onClick={() => setExamForm(p => ({ ...p, exam_name: n }))}
                        className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-lg hover:bg-blue-100">{n}</button>
                    ))
                    : ['BISE Peshawar Annual Result 2026','BISE Peshawar Annual Result 2025','SSC Annual Result 2026'].map(n => (
                      <button key={n} onClick={() => setExamForm(p => ({ ...p, exam_name: n }))}
                        className="text-xs bg-green-50 text-green-700 font-bold px-2 py-1 rounded-lg hover:bg-green-100">{n}</button>
                    ))
                  }
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Year</label>
                <input value={examForm.year} onChange={e => setExamForm(p => ({ ...p, year: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExamForm(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl">Cancel</button>
              <button onClick={createExam} disabled={saving}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl">
                {saving ? 'Creating...' : '✅ Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
