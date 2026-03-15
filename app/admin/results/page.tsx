'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AdminLayout from '@/components/admin/AdminLayout'
import ResultsClient from './ResultsClient'

const supabase = createClient()
export default function Page() {
  const [adminName, setAdminName] = useState('Admin')
  const [results, setResults]     = useState<any[]>([])
  const [students, setStudents]   = useState<any[]>([])
  const [ready, setReady]         = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
      if (!p || p.role !== 'admin') { window.location.href = '/dashboard'; return }
      setAdminName(p.full_name || 'Admin')
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from('results').select('*').order('created_at',{ascending:false}),
        supabase.from('students').select('id,full_name,class,section,roll_no').eq('status','active').order('full_name'),
      ])
      setResults(r || [])
      setStudents(s || [])
      const { data: sett } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
      setSchoolInfo(sett)
      setReady(true)
    }
    load()
  }, [])
  if (!ready) return <Loading/>
  return <AdminLayout adminName={adminName} logoUrl={schoolInfo?.logo_url} schoolName={schoolInfo?.short_name}><ResultsClient initialResults={results} students={students}/></AdminLayout>
}
function Loading() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div></div> }
