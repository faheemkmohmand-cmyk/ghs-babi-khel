import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CLASSES = ['6','7','8','9','10']

export default async function AttendancePage() {
  const supabase = createClient()

  // Get today and this month
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  // Get attendance summary per class for this month
  const { data: attendance } = await supabase
    .from('attendance')
    .select('class, date, status')
    .gte('date', monthStart)
    .lte('date', today)

  // Get student counts per class
  const { data: students } = await supabase
    .from('students')
    .select('class')
    .eq('status', 'active')

  // Build summary per class
  const classSummary = CLASSES.map(cls => {
    const clsStudents = (students || []).filter(s => s.class === cls).length
    const clsAtt = (attendance || []).filter(a => a.class === cls)
    const totalDays = clsAtt.length > 0 ? [...new Set(clsAtt.map(a => a.date))].length : 0
    const presentCount = clsAtt.filter(a => a.status === 'present').length
    const absentCount = clsAtt.filter(a => a.status === 'absent').length
    const lateCount = clsAtt.filter(a => a.status === 'late').length
    const total = presentCount + absentCount + lateCount
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0

    // Today's attendance for this class
    const todayAtt = (attendance || []).filter(a => a.class === cls && a.date === today)
    const todayPresent = todayAtt.filter(a => a.status === 'present').length
    const todayTotal = todayAtt.length

    return { cls, clsStudents, totalDays, presentCount, absentCount, lateCount, pct, todayPresent, todayTotal }
  })

  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 text-white px-4 py-3 flex items-center gap-3 shadow-lg" style={{ background: '#0a1628' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#014d26,#4ade80)' }}>🏫</div>
          <span className="font-bold text-sm hidden sm:block">GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white font-bold text-sm">Attendance</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black text-slate-800 mb-2">✅ Attendance Overview</h1>
          <p className="text-slate-500">Monthly attendance summary for all classes · {month}</p>
        </div>

        {/* Overall school summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Classes',  val: CLASSES.length,  icon: '🏫', bg: 'bg-slate-900 text-white' },
            { label: 'Days This Month', val: [...new Set((attendance||[]).map(a=>a.date))].length, icon: '📅', bg: 'bg-blue-600 text-white' },
            { label: 'Present Records', val: (attendance||[]).filter(a=>a.status==='present').length, icon: '✅', bg: 'bg-green-700 text-white' },
            { label: 'Absent Records',  val: (attendance||[]).filter(a=>a.status==='absent').length,  icon: '❌', bg: 'bg-red-600 text-white' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl font-black">{s.val}</div>
              <div className="text-xs font-bold opacity-70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per class breakdown */}
        <h2 className="font-display text-2xl font-black text-slate-800 mb-4">Class-wise Summary</h2>
        <div className="space-y-4">
          {classSummary.map(({ cls, clsStudents, totalDays, presentCount, absentCount, lateCount, pct, todayPresent, todayTotal }) => (
            <div key={cls} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Class header */}
              <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                style={{ background: 'linear-gradient(135deg, #0a1628, #014d26)' }}>
                <div>
                  <h3 className="font-display text-xl font-black text-white">Class {cls}</h3>
                  <p className="text-white/50 text-sm">{clsStudents} students enrolled · {totalDays} school days this month</p>
                </div>
                <div className="flex items-center gap-3">
                  {todayTotal > 0 && (
                    <div className="text-center bg-white/10 rounded-xl px-4 py-2">
                      <div className="text-white font-black text-lg">{todayPresent}/{todayTotal}</div>
                      <div className="text-white/50 text-xs">Today</div>
                    </div>
                  )}
                  <div className={`text-center rounded-xl px-4 py-2 ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                    <div className="text-white font-black text-2xl">{pct}%</div>
                    <div className="text-white/80 text-xs">Avg Present</div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                {[
                  { label: 'Present', val: presentCount, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Absent',  val: absentCount,  color: 'text-red-600',   bg: 'bg-red-50'   },
                  { label: 'Late',    val: lateCount,    color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} px-5 py-4 text-center`}>
                    <div className={`font-display text-2xl font-black ${s.color}`}>{s.val}</div>
                    <div className="text-slate-500 text-xs font-bold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-6 py-3 bg-slate-50">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>Attendance Rate</span>
                  <span className={pct >= 75 ? 'text-green-700' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-700 font-bold text-sm">ℹ️ Note</p>
          <p className="text-blue-600 text-sm mt-1">This page shows class-wide attendance statistics. Individual student attendance records are managed by the school admin. For your personal attendance record, please contact the school office.</p>
        </div>
      </div>
    </div>
  )
}
