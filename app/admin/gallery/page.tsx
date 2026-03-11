'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Album = { id:string; title:string; description:string; cover_url:string; date:string; category:string }
type Photo = { id:string; album_id:string; url:string; caption:string }

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selAlbum, setSelAlbum] = useState<Album|null>(null)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [albumForm, setAlbumForm] = useState({ title:'', description:'', date:new Date().toISOString().split('T')[0], category:'general' })
  const [uploading, setUploading] = useState(false)
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [profile, setProfile] = useState<{full_name:string}|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href='/login'; return }
      const { data: p } = await supabase.from('profiles').select('role,full_name').eq('id',user.id).single()
      if (!p||p.role!=='admin') { window.location.href='/dashboard'; return }
      setProfile(p)
      const { data: albs } = await supabase.from('gallery_albums').select('*').order('created_at',{ascending:false})
      const { data: phts } = await supabase.from('gallery_photos').select('*').order('created_at')
      setAlbums(albs||[])
      setPhotos(phts||[])
      setLoading(false)
    }
    init()
  }, [])

  async function handleSaveAlbum() {
    if (!albumForm.title) { toast.error('Album title required'); return }
    setSavingAlbum(true)
    try {
      const { data, error } = await supabase.from('gallery_albums').insert(albumForm).select().single()
      if (error) { toast.error(error.message); return }
      setAlbums(prev=>[data,...prev])
      toast.success('Album created ✅')
      setShowAlbumModal(false)
      setAlbumForm({ title:'', description:'', date:new Date().toISOString().split('T')[0], category:'general' })
    } finally { setSavingAlbum(false) }
  }

  async function handleDeleteAlbum(id:string, title:string) {
    if (!confirm(`Delete album "${title}" and all its photos?`)) return
    await supabase.from('gallery_photos').delete().eq('album_id',id)
    await supabase.from('gallery_albums').delete().eq('id',id)
    setPhotos(prev=>prev.filter(p=>p.album_id!==id))
    setAlbums(prev=>prev.filter(a=>a.id!==id))
    if (selAlbum?.id===id) setSelAlbum(null)
    toast.success('Album deleted')
  }

  async function handleUpload(files:FileList) {
    if (!selAlbum) { toast.error('Select an album first'); return }
    setUploading(true)
    const newPhotos:Photo[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `gallery/${selAlbum.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('gallery').upload(path,file)
      if (!error) {
        const url = supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
        const { data } = await supabase.from('gallery_photos').insert({ album_id:selAlbum.id, url, caption:'' }).select().single()
        if (data) newPhotos.push(data)
      }
    }
    if (newPhotos.length>0&&!selAlbum.cover_url) {
      const { data } = await supabase.from('gallery_albums').update({cover_url:newPhotos[0].url}).eq('id',selAlbum.id).select().single()
      if (data) { setAlbums(prev=>prev.map(a=>a.id===selAlbum.id?data:a)); setSelAlbum(data) }
    }
    setPhotos(prev=>[...prev,...newPhotos])
    setUploading(false)
    toast.success(`${newPhotos.length} photo(s) uploaded ✅`)
  }

  async function handleDeletePhoto(id:string) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('gallery_photos').delete().eq('id',id)
    setPhotos(prev=>prev.filter(p=>p.id!==id))
    toast.success('Photo deleted')
  }

  async function setCover(url:string) {
    if (!selAlbum) return
    const { data } = await supabase.from('gallery_albums').update({cover_url:url}).eq('id',selAlbum.id).select().single()
    if (data) { setAlbums(prev=>prev.map(a=>a.id===selAlbum.id?data:a)); setSelAlbum(data); toast.success('Cover set ✅') }
  }

  const albumPhotos = photos.filter(p=>p.album_id===selAlbum?.id)

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center"><div className="w-8 h-8 border-4 border-green-900 border-t-transparent rounded-full spinner mx-auto mb-3"/><p className="text-slate-500 font-semibold">Loading...</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-8 h-8 rounded-full bg-gradient-to-br from-green-950 to-green-400 flex items-center justify-center text-sm">🏫</Link>
            <span className="text-slate-400 text-sm">/</span>
            <span className="font-display font-bold text-slate-800 text-sm">Gallery</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm hidden sm:block">{profile?.full_name}</span>
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">ADMIN</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-red-500 font-semibold border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">Sign Out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">🖼️ Gallery</h1>
            <p className="text-slate-500 text-sm mt-0.5">{albums.length} albums · {photos.length} photos</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">← Admin</Link>
            <button onClick={()=>setShowAlbumModal(true)} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md">➕ New Album</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Albums list */}
          <div className="lg:col-span-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Albums</p>
            <div className="space-y-2">
              {albums.length===0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center"><div className="text-3xl mb-2">🖼️</div><p className="text-slate-400 text-xs font-semibold">No albums yet</p></div>
              ) : albums.map(a=>{
                const count = photos.filter(p=>p.album_id===a.id).length
                return (
                  <div key={a.id} onClick={()=>setSelAlbum(a)} className={`cursor-pointer rounded-2xl border overflow-hidden transition-all hover:shadow-md ${selAlbum?.id===a.id?'border-green-900 ring-2 ring-green-900/20':'border-slate-100 bg-white'}`}>
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      {a.cover_url?<img src={a.cover_url} className="w-full h-full object-cover" alt=""/>
                        :<div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">🖼️</div>}
                    </div>
                    <div className="p-3">
                      <p className="font-black text-slate-800 text-sm truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{count} photo{count!==1?'s':''}</p>
                      <button onClick={e=>{e.stopPropagation();handleDeleteAlbum(a.id,a.title)}} className="mt-1.5 text-xs text-red-400 hover:text-red-600 font-bold transition-colors">🗑️ Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Photos */}
          <div className="lg:col-span-3">
            {!selAlbum ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-80 flex items-center justify-center">
                <div className="text-center"><div className="text-5xl mb-3">📂</div><p className="text-slate-400 font-semibold">Select an album to view and upload photos</p></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h2 className="font-display font-black text-slate-800 text-lg">{selAlbum.title}</h2>
                    {selAlbum.description&&<p className="text-slate-500 text-sm">{selAlbum.description}</p>}
                  </div>
                  <label className={`cursor-pointer font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm shadow-md ${uploading?'bg-slate-200 text-slate-500 cursor-not-allowed':'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                    {uploading?<><span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-500 rounded-full spinner"/>Uploading...</>:<>📤 Upload Photos</>}
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e=>e.target.files&&handleUpload(e.target.files)}/>
                  </label>
                </div>
                {albumPhotos.length===0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-60 flex items-center justify-center">
                    <div className="text-center"><div className="text-4xl mb-2">📷</div><p className="text-slate-400 font-semibold text-sm">No photos yet. Click Upload Photos!</p></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {albumPhotos.map(ph=>(
                      <div key={ph.id} className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-100">
                        <img src={ph.url} className="w-full h-full object-cover" alt="" loading="lazy"/>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                          <button onClick={()=>setCover(ph.url)} className="bg-white/90 hover:bg-white text-slate-800 text-xs font-black px-2.5 py-1.5 rounded-xl transition-all">🖼️ Cover</button>
                          <button onClick={()=>handleDeletePhoto(ph.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-2.5 py-1.5 rounded-xl transition-all">🗑️</button>
                        </div>
                        {selAlbum.cover_url===ph.url&&<div className="absolute top-2 left-2 bg-amber-400 text-white text-xs font-black px-2 py-0.5 rounded-lg">Cover</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAlbumModal&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-display text-xl font-black text-slate-800">➕ New Album</h2>
              <button onClick={()=>setShowAlbumModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Album Title *</label>
                <input value={albumForm.title} onChange={e=>setAlbumForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Annual Sports Day 2025" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={albumForm.description} onChange={e=>setAlbumForm(p=>({...p,description:e.target.value}))} placeholder="Brief description..." rows={2} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                <input type="date" value={albumForm.date} onChange={e=>setAlbumForm(p=>({...p,date:e.target.value}))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors"/>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowAlbumModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSaveAlbum} disabled={savingAlbum} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {savingAlbum&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner"/>}
                📁 Create Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
