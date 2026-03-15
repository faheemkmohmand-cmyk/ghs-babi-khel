'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { section: 'Overview' },
  { icon: '📊', label: 'Dashboard',      href: '/admin' },
  { section: 'Students' },
  { icon: '🎓', label: 'Students',       href: '/admin/students' },
  { icon: '📈', label: 'Results',        href: '/admin/results' },
  { section: 'School' },
  { icon: '👨‍🏫', label: 'Teachers',      href: '/admin/teachers' },
  { icon: '📅', label: 'Timetable',      href: '/admin/timetable' },
  { icon: '📝', label: 'Exam Schedule',  href: '/admin/exams' },
  { section: 'Content' },
  { icon: '📢', label: 'Notices',        href: '/admin/notices' },
  { icon: '📰', label: 'News',           href: '/admin/news' },
  { icon: '📚', label: 'Library',        href: '/admin/library' },
  { icon: '🏆', label: 'Achievements',   href: '/admin/achievements' },
  { icon: '🖼️', label: 'Gallery',        href: '/admin/gallery' },
  { section: 'System' },
  { icon: '⚙️', label: 'Settings',       href: '/admin/settings' },
]

export default function AdminLayout({ adminName, children, logoUrl, schoolName }: { adminName: string; children: React.ReactNode; logoUrl?: string; schoolName?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const path = usePathname()
  const isActive = (href: string) => href === '/admin' ? path === '/admin' : path.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0"/>
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg flex-shrink-0" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <div>
            <div className="font-bold text-white text-sm" style={{fontFamily:'Georgia,serif'}}>{schoolName || 'GHS Babi Khel'}</div>
            <div className="text-green-400 text-xs font-bold">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map((item, i) => {
          if ('section' in item && !('href' in item)) return (
            <p key={i} className="text-white/25 text-xs font-black uppercase tracking-widest px-3 pt-4 pb-1">{item.section}</p>
          )
          const active = isActive(item.href!)
          return (
            <Link key={item.href} href={item.href!} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5
                ${active ? 'bg-green-900/25 text-green-400 border-l-[3px] border-green-400' : 'text-white/45 hover:text-white hover:bg-white/6'}`}>
              <span className="w-5 text-center">{item.icon}</span>{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2 rounded-xl p-2.5" style={{background:'rgba(255,255,255,0.05)'}}>
          <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black flex-shrink-0">{adminName?.[0]?.toUpperCase()||'A'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-bold truncate">{adminName}</div>
            <div className="text-green-400 text-xs">Super Admin</div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-white/30 hover:text-red-400 text-xs px-2 py-1 rounded-lg transition-all">Exit</button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 z-50" style={{background:'linear-gradient(180deg,#050d1a,#0a1628)'}}>
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 z-10" style={{background:'linear-gradient(180deg,#050d1a,#0a1628)'}}>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 h-14 flex items-center px-4 gap-3 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xl">☰</button>
          <div className="flex-1" />
          <a href="/" className="text-xs font-bold text-green-800 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all flex items-center gap-1">🏫 Main Page</a>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-green-900 flex items-center justify-center text-white text-xs font-black">{adminName?.[0]?.toUpperCase()}</div>
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">{adminName}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
