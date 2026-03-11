import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
export default function Page() {
  return (
    <AdminLayout adminName="">
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📅</div>
        <h1 className="font-display text-3xl font-black text-slate-800 mb-3">Timetable Management</h1>
        <p className="text-slate-500 mb-6">This section is coming in Phase 3.</p>
        <Link href="/admin" className="bg-green-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-950 transition-all">← Back to Dashboard</Link>
      </div>
    </AdminLayout>
  )
}
