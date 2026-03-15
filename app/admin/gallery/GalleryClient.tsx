'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

import toast from 'react-hot-toast'

const supabase = createClient()

type Album = { id:string; title:string; description?:string; cover_url?:string; date?:string; category?:string; created_at:string }
type Photo = { id:string; album_id:string; url:string; caption?:string; created_at:string }

export default function GalleryClient({ initialAlbums, initialPhotos }: { initialAlbums:Album[]; initialPhotos:Photo[] }) {
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selAlbum, setSelAlbum] = useState<Album|null>(null)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [albumForm, setAlbumForm] = useState({ title:'', description:'', date:'', category:'general' })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const albumPhotos = photos.filter(p => p.album_id === selAlbum?.id)

  async function handleSaveAlbum() {
    if (!albumForm.title) { toast.error('Album name required'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('gallery_albums').insert(albumForm).select().single()
      if (error) { toast.error(error.message); return }
      setAlbums(prev => [data, ...prev])
      toast.success('Album created ✅')
      setShowAlbumModal(false)
      setAlbumForm({ title:'', description:'', date:'', category:'general' })
    } finally { setSaving(false) }
  }

  async function handleDeleteAlbum(id:string, name:string) {
    if (!confirm(`Delete album "${name}" and all its photos?`)) return
    await supabase.from('gallery_photos').delete().eq('album_id', id)
    await supabase.from('gallery_albums').delete().eq('id', id)
    setPhotos(prev => prev.filter(p=>p.album_id!==id))
    setAlbums(prev => prev.filter(a=>a.id!==id))
    if (selAlbum?.id===id) setSelAlbum(null)
    toast.success('Album deleted')
  }

  async function handleUploadPhotos(files: FileList) {
    if (!selAlbum) { toast.error('Select an album first'); return }
    setUploading(true)
    const total = files.length
    let done = 0
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `gallery/${selAlbum.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('gallery').upload(path, file)
      if (!error) {
        const url = supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
        const { data } = await supabase.from('gallery_photos').insert({ album_id: selAlbum.id, url }).select().single()
        if (data) newPhotos.push(data)
      }
      done++
      setUploadProgress(Math.round((done/total)*100))
    }
    // Update album cover if no cover yet
    if (newPhotos.length > 0 && !selAlbum.cover_url) {
      const { data } = await supabase.from('gallery_albums').update({ cover_url: newPhotos[0].url }).eq('id', selAlbum.id).select().single()
      if (data) { setAlbums(prev => prev.map(a=>a.id===selAlbum.id?data:a)); setSelAlbum(data) }
    }
    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
    setUploadProgress(0)
    toast.success(`${newPhotos.length} photo(s) uploaded ✅`)
  }

  async function handleDeletePhoto(id:string, url:string) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('gallery_photos').delete().eq('id', id)
    setPhotos(prev => prev.filter(p=>p.id!==id))
    toast.success('Photo deleted')
  }

  async function setCover(photo:Photo) {
    if (!selAlbum) return
    const { data } = await supabase.from('gallery_albums').update({ cover_url: photo.url }).eq('id', selAlbum.id).select().single()
    if (data) { setAlbums(prev => prev.map(a=>a.id===selAlbum.id?data:a)); setSelAlbum(data); toast.success('Cover photo set ✅') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>🖼️ Photo Gallery</h1>
          <p className="text-slate-500 text-sm">{albums.length} albums · {photos.length} photos</p>
        </div>
        <button onClick={()=>setShowAlbumModal(true)} className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
          ➕ New Album
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Albums list */}
        <div className="lg:col-span-1">
          <h2 className="font-black text-slate-600 text-xs uppercase tracking-widest mb-3">Albums</h2>
          <div className="space-y-2">
            {albums.length===0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <div className="text-3xl mb-2">🖼️</div>
                <p className="text-slate-400 text-xs font-semibold">No albums yet</p>
              </div>
            ) : albums.map(a => {
              const count = photos.filter(p=>p.album_id===a.id).length
              return (
                <div key={a.id}
                  onClick={()=>setSelAlbum(a)}
                  className={`cursor-pointer rounded-2xl border overflow-hidden transition-all hover:shadow-md ${selAlbum?.id===a.id?'border-green-900 ring-2 ring-green-900/20':'border-slate-100 bg-white'}`}>
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    {a.cover_url
                      ? <img src={a.cover_url} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">🖼️</div>}
                  </div>
                  <div className="p-3">
                    <p className="font-black text-slate-800 text-sm truncate">{a.title}</p>
                    <p className="text-xs text-slate-400">{count} photo{count!==1?'s':''}</p>
                    {a.date && <p className="text-xs text-slate-400">{a.date}</p>}
                    <button onClick={e=>{e.stopPropagation();handleDeleteAlbum(a.id,a.title)}}
                      className="mt-2 text-xs text-red-400 hover:text-red-600 font-bold transition-colors">🗑️ Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Photos area */}
        <div className="lg:col-span-3">
          {!selAlbum ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">📂</div>
                <p className="text-slate-400 font-semibold">Select an album to view and upload photos</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-black text-slate-800 text-lg" style={{fontFamily:'Georgia,serif'}}>{selAlbum.title}</h2>
                  {selAlbum.description && <p className="text-slate-500 text-sm">{selAlbum.description}</p>}
                </div>
                <label className={`cursor-pointer font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm shadow-md ${uploading?'bg-slate-200 text-slate-500':'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                  {uploading ? (
                    <><span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-500 rounded-full animate-spin"/>{uploadProgress}% uploading...</>
                  ) : <>📤 Upload Photos</>}
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" disabled={uploading}
                    onChange={e=>e.target.files && handleUploadPhotos(e.target.files)} />
                </label>
              </div>

              {albumPhotos.length===0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-200 h-60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-slate-400 font-semibold text-sm">No photos yet. Click Upload Photos to add some!</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {albumPhotos.map(p => (
                    <div key={p.id} className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-100">
                      <img src={p.url} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                        <button onClick={()=>setCover(p)}
                          className="bg-white/90 hover:bg-white text-slate-800 text-xs font-black px-2.5 py-1.5 rounded-xl transition-all"
                          title="Set as album cover">🖼️ Cover</button>
                        <button onClick={()=>handleDeletePhoto(p.id, p.url)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-2.5 py-1.5 rounded-xl transition-all">🗑️</button>
                      </div>
                      {selAlbum.cover_url===p.url && (
                        <div className="absolute top-2 left-2 bg-amber-400 text-white text-xs font-black px-2 py-0.5 rounded-lg">Cover</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-800" style={{fontFamily:'Georgia,serif'}}>➕ New Album</h2>
              <button onClick={()=>setShowAlbumModal(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Album Title *</label>
                <input value={albumForm.title} onChange={e=>setAlbumForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Annual Function 2025"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={albumForm.description} onChange={e=>setAlbumForm(p=>({...p,description:e.target.value}))} placeholder="Brief description..." rows={2}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Event Date</label>
                <input type="date" value={albumForm.date} onChange={e=>setAlbumForm(p=>({...p,date:e.target.value}))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={()=>setShowAlbumModal(false)} className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveAlbum} disabled={saving} className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:null}
                📁 Create Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
