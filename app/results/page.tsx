import Link from 'next/link'
export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏗️</div>
        <h1 className="font-display text-3xl font-black text-navy-800 mb-3 capitalize">results</h1>
        <p className="text-slate-500 mb-6">This page is coming in Phase 2. The admin can already add data from the admin panel.</p>
        <Link href="/" className="bg-green-900 text-white font-bold px-6 py-3 rounded-2xl hover:bg-green-950 transition-all">← Back to Home</Link>
      </div>
    </div>
  )
}
