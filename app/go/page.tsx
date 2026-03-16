'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoPage() {
  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      createClient().from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        .then(({ data }: any) => {
          window.location.href = (data?.role === 'admin') ? '/admin' : '/dashboard'
        })
        .catch(() => { window.location.href = '/dashboard' })
    })
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
