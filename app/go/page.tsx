'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoPage() {
  useEffect(() => {
    async function go() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle() as any

      if (profile?.role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    }
    go()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#020810,#014d26)'}}>
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="font-bold text-lg">Taking you to your dashboard...</p>
      </div>
    </div>
  )
}
