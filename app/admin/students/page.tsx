'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AdminLayout from '@/components/admin/AdminLayout'
import StudentsClient from './StudentsClient'


export default function Page() {
  const [adminName, setAdminName] = useState('Admin')
  const [data, setData]           = useState<any[]>([])
  const [ready, setReady]         = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { window.location.href = '/login'; return }
      const user = session.user
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle() as any
      if (!p || p.role !== 'admin') { window.location.href = '/dashboard'; return }
      setAdminName(p.full_name || 'Admin')
      const { data: d } = await supabase.from('students').select('*').order('class').order('roll_no')
      setData(d || [])
      const { data: sett } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle() as any
      setSchoolInfo(sett)
      setReady(true)
    }
    load()
  }, [])
  if (!ready) return <Loading/>
  return <AdminLayout adminName={adminName} logoUrl={schoolInfo?.logo_url} schoolName={schoolInfo?.short_name}><StudentsClient initialStudents={data}/></AdminLayout>
}
function Loading() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div></div> }
