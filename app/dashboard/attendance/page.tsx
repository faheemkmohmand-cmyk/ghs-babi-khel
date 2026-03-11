import Link from 'next/link'
export default function MyAttendancePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto text-center pt-20">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="font-display text-3xl font-black text-navy-800 mb-3">My Attendance</h1>
        <p className="text-slate-500 mb-6">Your attendance record will appear here once admin marks attendance.</p>
        <Link href="/dashboard" className="bg-green-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-950 transition-all">← Back to Dashboard</Link>
      </div>
    </div>
  )
}
