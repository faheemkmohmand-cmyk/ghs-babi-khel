'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AdminLayout from '@/components/admin/AdminLayout'
import GalleryClient from './GalleryClient'

export default function Page() {
  const [adminName, setAdminName] = useState('Admin')
  const [albums, setAlbums]       = useState<any[]>([])
  const [photos, setPhotos]       = useState<any[]>([])
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
      const [{ data: a }, { data: ph }] = await Promise.all([
        supabase.from('gallery_albums').select('*').order('created_at',{ascending:false}),
        supabase.from('gallery_photos').select('*').order('created_at',{ascending:false}),
      ])
      setAlbums(a || [])
      setPhotos(ph || [])
      const { data: sett } = await supabase.from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
      setSchoolInfo(sett)
      setReady(true)
    }
    load()
  }, [])
  if (!ready) return <Loading/>
  return <AdminLayout adminName={adminName} logoUrl={schoolInfo?.logo_url} schoolName={schoolInfo?.short_name}><GalleryClient initialAlbums={albums} initialPhotos={photos}/></AdminLayout>
}
function Loading() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div></div> }
