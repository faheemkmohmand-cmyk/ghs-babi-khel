'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function GoPage() {
  const [status, setStatus] = useState('Checking your account...')

  useEffect(() => {
    async function go() {
      const supabase = createClient()

      // Try getSession first
      let userId = null
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        userId = session.user.id
      } else {
        // Session not in memory yet, try getUser which validates from server
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          userId = user.id
        } else {
          window.location.href = '/login'
          return
        }
      }

      setStatus('Loading your dashboard...')

      // Get role from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle() as any

      console.log('User ID:', userId)
      console.log('Profile:', profile)
      console.log('Error:', error)

      if (profile?.role === 'admin') {
        setStatus('Going to Admin Panel...')
        window.location.href = '/admin'
      } else {
        setStatus('Going to Dashboard...')
        window.location.href = '/dashboard'
      }
    }
    go()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="font-bold">{status}</p>
      </div>
    </div>
  )
}
