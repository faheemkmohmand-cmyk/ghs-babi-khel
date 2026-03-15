import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AttendancePage() {
  let attendance: any[] = []
  let students: any[] = []
  try {
    const supabase = createClient()
    const { data: settings } = await supabase.from('school_settings').select('logo_url').limit(1).maybeSingle()
    const { data: settings } = await supabase.from('school_settings').select('logo_url').limit(1).maybeSingle()
    const [{ data: att }, { data: stu }] = await Promise.all([
      supabase.from('attendance').select('*').order('date', { ascending: false }),
      supabase.from('students').select('id,full_name,class,section').eq('status','active'),
    ])
    attendance = att || []
    students = stu || []
  } catch (_) {}

  const classes = ['6','7','8','9','10']

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm">GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Attendance</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>✅ Attendance</h1>
        <p className="text-slate-500 mb-8">Class-wise attendance summary — GHS Babi Khel</p>
        {attendance.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-slate-400 font-semibold">Attendance records will appear here once added by admin</p>
          </div>
        ) : (
          <div className="space-y-6">
            {classes.map(cls => {
              const clsStudents = students.filter(s => s.class === cls).length
              const clsAtt = attendance.filter((a:any) => a.class === cls)
              const totalDays = clsAtt.length > 0 ? Array.from(new Set(clsAtt.map((a:any) => a.date))).length : 0
              const presentCount = clsAtt.filter((a:any) => a.status === 'present').length
              const absentCount  = clsAtt.filter((a:any) => a.status === 'absent').length
              const lateCount    = clsAtt.filter((a:any) => a.status === 'late').length
              if (clsAtt.length === 0) return null
              const pct = clsAtt.length > 0 ? Math.round((presentCount / clsAtt.length) * 100) : 0
              return (
                <div key={cls} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-slate-800 text-white font-black px-3 py-1.5 rounded-xl text-sm">Class {cls}</span>
                    <span className="text-slate-500 text-sm">{clsStudents} students · {totalDays} days recorded</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {label:'Present', val:presentCount, color:'text-green-700', bg:'bg-green-50'},
                      {label:'Absent',  val:absentCount,  color:'text-red-600',   bg:'bg-red-50'},
                      {label:'Late',    val:lateCount,    color:'text-amber-600', bg:'bg-amber-50'},
                      {label:'Avg %',   val:pct+'%',      color:'text-blue-700',  bg:'bg-blue-50'},
                    ].map(s=>(
                      <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                        <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                        <div className="text-slate-500 text-xs mt-1">{s.label}</div>
                      </div>
                    ))}
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
