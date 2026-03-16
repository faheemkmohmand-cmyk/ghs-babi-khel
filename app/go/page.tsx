'use client'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function GoPage() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle() as any
      window.location.href = p?.role === 'admin' ? '/admin' : '/dashboard'
    }).catch(() => { window.location.href = '/login' })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="font-bold">Loading your dashboard...</p>
      </div>
    </div>
  )
}
