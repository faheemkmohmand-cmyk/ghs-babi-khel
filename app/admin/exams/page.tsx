'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const CLASSES = ['6','7','8','9','10']
type SchedRow = { date:string; subject:string; classes:string }
type Exam = { id:string; name:string; type:string; classes:string[]; start_date:string; end_date:string; status:string; venue:string; time_slot:string; schedule:SchedRow[] }
const emptyForm = { name:'', type:'annual', classes:[] as string[], start_date:'', end_date:'', status:'upcoming', venue:'Examination Hall', time_slot:'8:00 AM - 11:00 AM' }
const statusBadge: Record<string,string> = { upcoming:'bg-blue-50 text-blue-700 border-blue-200', ongoing:'bg-green-50 text-green-700 border-green-200', completed:'bg-slate-100 text-slate-600 border-slate-200' }

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Exam|null>(null)
  const [form, setForm] = useState(emptyForm)
  const [schedRows, setSchedRows] = useState<SchedRow[]>([{date:'',subject:'',classes:''}])
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
      const { data } = await supabase.from('exams').select('*').order('start_date',{ascending:false})
      setExams(data||[])
      setLoading(false)
    }
    init()
  }, [])

  function openAdd() { setEditing(null); setForm(emptyForm); setSchedRows([{date:'',subject:'',classes:''}]); setShowModal(true) }
  function openEdit(e:Exam) {
    setEditing(e)
    setForm({ name:e.name, type:e.type, classes:e.classes||[], start_date:e.start_date, end_date:e.end_date, status:e.status, venue:e.venue||'Examination Hall', time_slot:e.time_slot||'8:00 AM - 11:00 AM' })
    setSchedRows(e.schedule?.length?e.schedule:[{date:'',subject:'',classes:''}])
    setShowModal(true)
  }
  function toggleClass(c:string) { setForm(p=>({...p,classes:p.classes.includes(c)?p.classes.filter(x=>x!==c):[...p.classes,c]})) }

  async function handleSave() {
    if (!form.name||!form.start_date||!form.end_date||form.classes.length===0) { toast.error('Fill name, dates and select at least one class'); return }
    setSaving(true)
    try {
      const payload = { ...form, schedule:schedRows.filter(r=>r.date&&r.subject) }
      if (editing) {
        const { data, error } = await supabase.from('exams').update(payload).eq('id',editing.id).select().single()
        if (error) { toast.error(error.message); return }
        setExams(prev=>prev.map(e=>e.id===editing.id?data:e))
        toast.success('Exam updated ✅')
      } else {
        const { data, error } = await supabase.from('exams').insert(payload).select().single()
        if (error) { toast.error(error.message); return }
        setExams(prev=>[data,...prev])
        toast.success('Exam created ✅')
      }
      setShowModal(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id:string, name:string) {
    if (!confirm(`Delete "${name}"?`)) return
    await supabase.from('exams').delete().eq('id',id)
    setExams(prev=>prev.filter(e=>e.id!==id))
    toast.success('Deleted')
  }

  async function updateStatus(id:string, status:string) {
    const { data } = await supabase.from('exams').update({status}).eq('id',id).select().single()
    if (data) { setExams(prev=>prev.map(e=>e.id===id?data:e)); toast.success(`Status → ${status}`) }
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
            <span className="font-display font-bold text-slate-800 text-sm">Exams</span>
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
            <h1 className="font-display text-2xl font-black text-slate-800">📝 Exam Schedules</h1>
            <p className="text-slate-500 text-sm mt-0.5">{exams.length} exams · {exams.filter(e=>e.status==='upcoming').length} upcoming</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={openAdd} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">➕ Create Exam</button>
          </div>
        </div>
        <div className="space-y-4">
          {exams.length===0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center"><div className="text-5xl mb-3">📝</div><p className="text-slate-500 font-semibold">No exams yet. Create your first schedule!</p></div>
          ) : exams.map(e=>{
            const daysLeft = Math.ceil((new Date(e.start_date).getTime()-Date.now())/86400000)
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-5 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-black text-slate-800 text-lg">{e.name}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusBadge[e.status]}`}>{e.status}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg capitalize">{e.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>📅 {e.start_date} → {e.end_date}</span>
                      <span>🏛️ {e.venue}</span>
                      <span>⏰ {e.time_slot}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(e.classes||[]).map(c=><span key={c} className="bg-slate-800 text-white text-xs font-black px-2 py-0.5 rounded-lg">Class {c}</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {daysLeft>0&&e.status==='upcoming'&&<span className={`text-xs font-black px-3 py-1.5 rounded-full ${daysLeft<=7?'bg-red-50 text-red-600':daysLeft<=30?'bg-amber-50 text-amber-600':'bg-green-50 text-green-700'}`}>{daysLeft}d left</span>}
                    <select value={e.status} onChange={ev=>updateStatus(e.id,ev.target.value)} className="border-2 border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none focus:border-green-500 bg-white">
                      <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                    </select>
                    <button onClick={()=>openEdit(e)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600 transition-colors">✏️</button>
                    <button onClick={()=>handleDelete(e.id,e.name)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">🗑️</button>
                  </div>
                </div>
                {e.schedule?.length>0&&(
                  <div className="border-t border-slate-50 overflow-x-auto">
                    <table className="w-full"><thead><tr className="bg-slate-50"><th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase">Date</th><th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase">Subject</th><th className="px-4 py-2 text-left text-xs font-black text-slate-400 uppercase">Classes</th></tr></thead>
                    <tbody>{e.schedule.map((row,i)=><tr key={i} className="border-t border-slate-50"><td className="px-4 py-2 text-sm text-slate-500">{row.date}</td><td className="px-4 py-2 text-sm font-bold text-slate-800">{row.subject}</td><td className="px-4 py-2 text-sm text-slate-500">{row.classes}</td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h2 className="font-display text-xl font-black text-slate-800">{editing?'✏️ Edit Exam':'📝 Create Exam'}</h2>
              <button onClick={()=>setShowModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Exam Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Annual Examination 2025" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="annual">Annual</option><option value="halfyearly">Half-Yearly</option><option value="monthly">Monthly</option><option value="board">Board</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 bg-white">
                    <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Venue</label>
                  <input value={form.venue} onChange={e=>setForm(p=>({...p,venue:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Time Slot</label>
                  <input value={form.time_slot} onChange={e=>setForm(p=>({...p,time_slot:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Classes *</label>
                <div className="flex gap-2 flex-wrap">
                  {CLASSES.map(c=><button key={c} type="button" onClick={()=>toggleClass(c)} className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all ${form.classes.includes(c)?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>Class {c}</button>)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Date-wise Schedule (Optional)</label>
                  <button type="button" onClick={()=>setSchedRows(p=>[...p,{date:'',subject:'',classes:''}])} className="text-green-900 text-xs font-black hover:underline">+ Add Row</button>
                </div>
                <div className="space-y-2">
                  {schedRows.map((row,i)=>(
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <input type="date" value={row.date} onChange={e=>setSchedRows(p=>p.map((r,j)=>j===i?{...r,date:e.target.value}:r))} className="border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500"/>
                      <input value={row.subject} onChange={e=>setSchedRows(p=>p.map((r,j)=>j===i?{...r,subject:e.target.value}:r))} placeholder="Subject" className="border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500"/>
                      <div className="flex gap-1.5">
                        <input value={row.classes} onChange={e=>setSchedRows(p=>p.map((r,j)=>j===i?{...r,classes:e.target.value}:r))} placeholder="e.g. 9, 10" className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-green-500"/>
                        <button onClick={()=>setSchedRows(p=>p.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 px-2 text-sm">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                {editing?'✅ Update':'📝 Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
