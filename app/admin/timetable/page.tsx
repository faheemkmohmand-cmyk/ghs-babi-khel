'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AdminLayout from '@/components/admin/AdminLayout'
import TimetableClient from './TimetableClient'

export default function Page() {
  const [adminName, setAdminName] = useState('Admin')
  const [slots, setSlots]         = useState<any[]>([])
  const [teachers, setTeachers]   = useState<any[]>([])
  const [ready, setReady]         = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      // First try getSession (instant, reads cookie) then getUser as fallback
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (!user) { window.location.href = '/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
      if (!p || p.role !== 'admin') { window.location.href = '/dashboard'; return }
      setAdminName(p.full_name || 'Admin')
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('timetable').select('*').order('class').order('day').order('period'),
        supabase.from('teachers').select('id,full_name,subject').eq('status','active').order('full_name'),
      ])
      setSlots(s || [])
      setTeachers(t || [])
      const { data: sett } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
      setSchoolInfo(sett)
      setReady(true)
    }
    load()
  }, [])
  if (!ready) return <Loading/>
  return <AdminLayout adminName={adminName} logoUrl={schoolInfo?.logo_url} schoolName={schoolInfo?.short_name}><TimetableClient initialSlots={slots} teachers={teachers}/></AdminLayout>
}
function Loading() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div></div> }
