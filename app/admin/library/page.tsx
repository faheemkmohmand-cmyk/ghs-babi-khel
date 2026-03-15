'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AdminLayout from '@/components/admin/AdminLayout'
import LibraryClient from './LibraryClient'

export default function Page() {
  const [adminName, setAdminName] = useState('Admin')
  const [books, setBooks]         = useState<any[]>([])
  const [issues, setIssues]       = useState<any[]>([])
  const [students, setStudents]   = useState<any[]>([])
  const [ready, setReady]         = useState(false)
  const [schoolInfo, setSchoolInfo] = useState<any>(null)
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      // getSession first - if session exists (common case: already logged in), use it
      // If null, it means either not logged in OR session not yet loaded from cookie
      // We wait for onAuthStateChange to confirm before redirecting
      let session = (await supabase.auth.getSession()).data.session
      if (!session) {
        session = await new Promise(resolve => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            subscription.unsubscribe()
            resolve(s)
          })
          // Timeout after 2s - if still no session, not logged in
          setTimeout(() => { subscription.unsubscribe(); resolve(null) }, 2000)
        })
      }
      if (!session) { window.location.href = '/login'; return }
      const user = session.user
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
      if (!p || p.role !== 'admin') { window.location.href = '/dashboard'; return }
      setAdminName(p.full_name || 'Admin')
      const [{ data: b }, { data: i }, { data: s }] = await Promise.all([
        supabase.from('books').select('*').order('title'),
        supabase.from('book_issues').select('*, books(title), students(full_name,class,section)').eq('status','issued').order('issued_date',{ascending:false}),
        supabase.from('students').select('id,full_name,class,section,roll_no').eq('status','active').order('full_name'),
      ])
      setBooks(b || [])
      setIssues(i || [])
      setStudents(s || [])
      const { data: sett } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
      setSchoolInfo(sett)
      setReady(true)
    }
    load()
  }, [])
  if (!ready) return <Loading/>
  return <AdminLayout adminName={adminName} logoUrl={schoolInfo?.logo_url} schoolName={schoolInfo?.short_name}><LibraryClient books={books} issues={issues} students={students}/></AdminLayout>
}
function Loading() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div></div> }
