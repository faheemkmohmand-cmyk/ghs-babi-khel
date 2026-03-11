'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Result = { id: string; student_name: string; class: string; section: string; roll_no: string; exam_name: string; year: string; total_marks: number; obtained_marks: number; percentage: number; grade: string; result: string }

function calcGrade(pct: number) {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

export default function AdminResultsPage() {
  const supabase = createClient()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [form, setForm] = useState({ student_name:'', class:'6', section:'A', roll_no:'', exam_name:'', year: new Date().getFullYear().toString(), total_marks:500, obtained_marks:0 })

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('results').select('*').order('created_at', { ascending: false })
    if (filterClass) q = q.eq('class', filterClass)
    const { data } = await q
    setResults(data || [])
    setLoading(false)
  }, [filterClass])

  useEffect(() => { load() }, [load])

  const pct = form.total_marks > 0 ? Math.round((form.obtained_marks / form.total_marks) * 100) : 0

  async function save() {
    if (!form.student_name || !form.exam_name || !form.roll_no) { toast.error('Fill required fields'); return }
    setSaving(true)
    const percentage = parseFloat(((form.obtained_marks / form.total_marks) * 100).toFixed(2))
    const grade = calcGrade(percentage)
    try {
      const { error } = await supabase.from('results').insert({
        ...form, percentage, grade, result: percentage >= 40 ? 'Pass' : 'Fail', subjects: []
      })
      if (error) throw error
      toast.success('Result saved!')
      setShowForm(false); load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Delete this result?')) return
    await supabase.from('results').delete().eq('id', id)
    toast.success('Deleted'); load()
  }

  const gradeColor: Record<string, string> = { 'A+':'bg-green-100 text-green-800', 'A':'bg-green-50 text-green-700', 'B':'bg-sky-50 text-sky-700', 'C':'bg-amber-50 text-amber-700', 'D':'bg-orange-50 text-orange-700', 'F':'bg-red-50 text-red-700' }

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">📊 Results</h1>
            <p className="text-slate-500 text-sm">{results.length} results entered</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-green-900 hover:bg-green-950 text-white font-bold px-4 py-2.5 rounded-xl text-sm">+ Add Result</button>
        </div>

        <div className="flex gap-3">
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">All Classes</option>
            {['6','7','8','9','10'].map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? <div className="text-center py-16 text-slate-400">Loading...</div>
          : results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-slate-400 font-semibold">No results yet</p>
              <button onClick={() => setShowForm(true)} className="mt-4 bg-green-900 text-white font-bold px-5 py-2 rounded-xl text-sm">Add First Result</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{['Student','Class','Roll','Exam','Year','Total','Obtained','%','Grade','Result','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{r.student_name}</td>
                      <td className="px-4 py-3"><span className="bg-green-50 text-green-700 font-bold text-xs px-2 py-1 rounded-lg">{r.class}{r.section}</span></td>
                      <td className="px-4 py-3 text-slate-500">{r.roll_no}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{r.exam_name}</td>
                      <td className="px-4 py-3 text-slate-500">{r.year}</td>
                      <td className="px-4 py-3 text-slate-600">{r.total_marks}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{r.obtained_marks}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{r.percentage}%</td>
                      <td className="px-4 py-3"><span className={`text-xs font-black px-2 py-1 rounded-lg ${gradeColor[r.grade]||'bg-slate-100 text-slate-600'}`}>{r.grade}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${r.result==='Pass'?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>{r.result}</span></td>
                      <td className="px-4 py-3"><button onClick={() => del(r.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">Del</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-black text-slate-800 mb-5">Add Result</h2>
            <div className="space-y-3">
              {[
                { label:'Student Name *', key:'student_name', placeholder:'Full name' },
                { label:'Exam Name *', key:'exam_name', placeholder:'e.g. Annual Exam 2024' },
                { label:'Roll Number *', key:'roll_no', placeholder:'e.g. 01' },
                { label:'Year', key:'year', placeholder:'2024' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} placeholder={f.placeholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:'Class', key:'class', options:['6','7','8','9','10'] },
                  { label:'Section', key:'section', options:['A','B','C'] },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{f.label}</label>
                    <select value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                      {f.options.map(o => <option key={o} value={o}>{f.key==='class'?`Class ${o}`:o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Total Marks</label>
                  <input type="number" min="1" value={form.total_marks} onChange={e => setForm(p => ({...p, total_marks: parseInt(e.target.value)||0}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Obtained Marks</label>
                  <input type="number" min="0" max={form.total_marks} value={form.obtained_marks} onChange={e => setForm(p => ({...p, obtained_marks: parseInt(e.target.value)||0}))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                </div>
              </div>
              {form.obtained_marks > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Preview:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">{pct}%</span>
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${gradeColor[calcGrade(pct)]||'bg-slate-100 text-slate-600'}`}>{calcGrade(pct)}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct>=40?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>{pct>=40?'Pass':'Fail'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">
                {saving ? 'Saving...' : 'Save Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
