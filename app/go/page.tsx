'use client'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const ADMIN_EMAILS = ['faheemk.mohmand@gmail.com']

export default function GoPage() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }

      // Check admin by email first (always works, no RLS issues)
      if (ADMIN_EMAILS.includes(session.user.email || '')) {
        window.location.href = '/admin'
        return
      }

      // Also check profiles table role
      try {
        const { data: p } = await supabase
          .from('profiles').select('role')
          .eq('id', session.user.id).maybeSingle() as any
        if (p?.role === 'admin') { window.location.href = '/admin'; return }
      } catch(_) {}

      window.location.href = '/dashboard'
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
