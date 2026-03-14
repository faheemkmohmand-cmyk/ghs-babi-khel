'use client'
import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Album = { id: string; title: string; description: string; cover_url: string; date: string; category: string; published: boolean }
type Photo = { id: string; album_id: string; url: string; caption: string }

const CATEGORIES = ['General','Sports Day','Exam','Teachers','Programs','Parties','Memories','Tour','Graduation','Cultural']

export default function AdminGalleryPage() {
  const supabase = createClient()
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selAlbum, setSelAlbum] = useState<Album | null>(null)
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [albumForm, setAlbumForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0], category: 'General' })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: albs }, { data: phts }] = await Promise.all([
      supabase.from('gallery_albums').select('*').order('date', { ascending: false }),
      supabase.from('gallery_photos').select('*').order('created_at'),
    ])
    setAlbums(albs || [])
    setPhotos(phts || [])
    setLoading(false)
  }

  async function saveAlbum() {
    if (!albumForm.title) { toast.error('Album title required'); return }
    setSavingAlbum(true)
    const { data, error } = await supabase.from('gallery_albums')
      .insert({ ...albumForm, published: true }).select().single()
    setSavingAlbum(false)
    if (error) { toast.error(error.message); return }
    setAlbums(prev => [data, ...prev])
    setSelAlbum(data)
    setShowAlbumModal(false)
    setAlbumForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], category: 'General' })
    toast.success('Album created! Now upload photos.')
  }

  async function deleteAlbum(album: Album) {
    if (!confirm(`Delete "${album.title}" and all its photos?`)) return
    await supabase.from('gallery_photos').delete().eq('album_id', album.id)
    await supabase.from('gallery_albums').delete().eq('id', album.id)
    setPhotos(prev => prev.filter(p => p.album_id !== album.id))
    setAlbums(prev => prev.filter(a => a.id !== album.id))
    if (selAlbum?.id === album.id) setSelAlbum(null)
    toast.success('Album deleted')
  }

  async function uploadPhotos(files: FileList) {
    if (!selAlbum) { toast.error('Select an album first'); return }
    setUploading(true)
    const fileArr = Array.from(files)
    const newPhotos: Photo[] = []
    let done = 0

    for (const file of fileArr) {
      // Validate file
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); done++; continue }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); done++; continue }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `gallery/${selAlbum.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        done++
        setUploadProgress(Math.round((done / fileArr.length) * 100))
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)
      const { data: photo } = await supabase.from('gallery_photos')
        .insert({ album_id: selAlbum.id, url: publicUrl, caption: '' }).select().single()
      if (photo) newPhotos.push(photo)
      done++
      setUploadProgress(Math.round((done / fileArr.length) * 100))
    }

    // Set cover if album has none
    if (newPhotos.length > 0 && !selAlbum.cover_url) {
      const { data: updated } = await supabase.from('gallery_albums')
        .update({ cover_url: newPhotos[0].url }).eq('id', selAlbum.id).select().single()
      if (updated) {
        setAlbums(prev => prev.map(a => a.id === selAlbum.id ? updated : a))
        setSelAlbum(updated)
      }
    }

    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
    setUploadProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    toast.success(`✅ ${newPhotos.length} photo(s) uploaded!`)
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm('Delete this photo?')) return
    // Extract path from URL
    const url = new URL(photo.url)
    const path = url.pathname.split('/storage/v1/object/public/gallery/')[1]
    if (path) await supabase.storage.from('gallery').remove([path])
    await supabase.from('gallery_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    // If it was cover, clear it
    if (selAlbum?.cover_url === photo.url) {
      const remaining = photos.filter(p => p.album_id === selAlbum.id && p.id !== photo.id)
      const newCover = remaining[0]?.url || ''
      await supabase.from('gallery_albums').update({ cover_url: newCover }).eq('id', selAlbum.id)
      setAlbums(prev => prev.map(a => a.id === selAlbum!.id ? { ...a, cover_url: newCover } : a))
      setSelAlbum(prev => prev ? { ...prev, cover_url: newCover } : null)
    }
    toast.success('Photo deleted')
  }

  async function setCover(photo: Photo) {
    if (!selAlbum) return
    const { data } = await supabase.from('gallery_albums')
      .update({ cover_url: photo.url }).eq('id', selAlbum.id).select().single()
    if (data) {
      setAlbums(prev => prev.map(a => a.id === selAlbum.id ? data : a))
      setSelAlbum(data)
      toast.success('Cover photo set!')
    }
  }

  async function togglePublish(album: Album) {
    const { data } = await supabase.from('gallery_albums')
      .update({ published: !album.published }).eq('id', album.id).select().single()
    if (data) {
      setAlbums(prev => prev.map(a => a.id === album.id ? data : a))
      if (selAlbum?.id === album.id) setSelAlbum(data)
      toast.success(data.published ? 'Album published!' : 'Album hidden')
    }
  }

  const albumPhotos = photos.filter(p => p.album_id === selAlbum?.id)

  return (
    <AdminLayout adminName="">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-slate-800">🖼️ Photo Gallery</h1>
            <p className="text-slate-500 text-sm">{albums.length} albums · {photos.length} total photos</p>
          </div>
          <button onClick={() => setShowAlbumModal(true)}
            className="bg-green-900 hover:bg-green-950 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md">
            ➕ New Album
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-3 animate-pulse">🖼️</div>Loading gallery...
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Albums sidebar */}
            <div className="lg:col-span-1 space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Albums ({albums.length})
              </p>
              {albums.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-slate-400 text-sm font-semibold">No albums yet</p>
                  <button onClick={() => setShowAlbumModal(true)}
                    className="mt-3 text-xs text-green-700 font-bold hover:underline">
                    Create first album →
                  </button>
                </div>
              ) : albums.map(a => {
                const count = photos.filter(p => p.album_id === a.id).length
                const isSelected = selAlbum?.id === a.id
                return (
                  <div key={a.id}
                    onClick={() => setSelAlbum(a)}
                    className={`cursor-pointer rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                      isSelected ? 'border-green-900 ring-2 ring-green-900/20 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}>
                    {/* Cover */}
                    <div className="aspect-video bg-slate-100 overflow-hidden relative">
                      {a.cover_url
                        ? <img src={a.cover_url} className="w-full h-full object-cover" alt=""/>
                        : <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">🖼️</div>
                      }
                      {!a.published && (
                        <div className="absolute top-1 right-1 bg-slate-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">Hidden</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-black text-slate-800 text-sm truncate">{a.title}</p>
                      <p className="text-xs text-slate-400">{count} photo{count !== 1 ? 's' : ''} · {a.category}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={e => { e.stopPropagation(); togglePublish(a) }}
                          className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
                            a.published ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          {a.published ? '✅ Live' : '👁 Hidden'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteAlbum(a) }}
                          className="text-xs font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-all ml-auto">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Photos area */}
            <div className="lg:col-span-3">
              {!selAlbum ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 h-80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-3">👈</div>
                    <p className="text-slate-500 font-bold">Select an album to view and upload photos</p>
                    <p className="text-slate-400 text-sm mt-1">Or create a new album first</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Album header */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div>
                      <h2 className="font-display font-black text-slate-800 text-xl">{selAlbum.title}</h2>
                      <p className="text-slate-400 text-sm">{selAlbum.category} · {selAlbum.date} · {albumPhotos.length} photos</p>
                    </div>
                    <label className={`cursor-pointer font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm shadow-md ${
                      uploading ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}>
                      {uploading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin"/>
                          Uploading {uploadProgress}%...
                        </>
                      ) : <>📤 Upload Photos</>}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploading}
                        onChange={e => e.target.files && uploadPhotos(e.target.files)}
                      />
                    </label>
                  </div>

                  {/* Upload progress bar */}
                  {uploading && (
                    <div className="mb-4 bg-white rounded-xl border border-slate-100 p-3">
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                        <span>Uploading photos...</span><span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}/>
                      </div>
                    </div>
                  )}

                  {albumPhotos.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 h-60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-slate-400 font-semibold">No photos yet</p>
                        <p className="text-slate-300 text-sm">Click "Upload Photos" to add images</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {albumPhotos.map(ph => (
                        <div key={ph.id}
                          className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer"
                          style={{ aspectRatio: '1' }}>
                          <img
                            src={ph.url}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            alt=""
                            loading="lazy"
                            onClick={() => setLightbox(ph)}
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end justify-center pb-3 gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={e => { e.stopPropagation(); setCover(ph) }}
                              className="bg-white text-slate-800 text-xs font-black px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition-all">
                              🖼️ Cover
                            </button>
                            <button onClick={e => { e.stopPropagation(); deletePhoto(ph) }}
                              className="bg-red-500 text-white text-xs font-black px-2.5 py-1.5 rounded-xl hover:bg-red-600 transition-all">
                              🗑️ Del
                            </button>
                          </div>
                          {/* Cover badge */}
                          {selAlbum.cover_url === ph.url && (
                            <div className="absolute top-2 left-2 bg-amber-400 text-white text-xs font-black px-2 py-0.5 rounded-lg">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Album Modal */}
      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-display text-xl font-black text-slate-800">➕ New Album</h2>
              <button onClick={() => setShowAlbumModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Album Title *</label>
                <input value={albumForm.title} onChange={e => setAlbumForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual Sports Day 2025"
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                <select value={albumForm.category} onChange={e => setAlbumForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Description</label>
                <textarea value={albumForm.description} onChange={e => setAlbumForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description..." rows={2}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400 resize-none"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                <input type="date" value={albumForm.date} onChange={e => setAlbumForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"/>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowAlbumModal(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50">Cancel</button>
              <button onClick={saveAlbum} disabled={savingAlbum}
                className="flex-1 bg-green-900 hover:bg-green-950 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all">
                {savingAlbum ? 'Creating...' : '📁 Create Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl font-bold w-10 h-10 flex items-center justify-center">×</button>
          <img src={lightbox.url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}/>
        </div>
      )}
    </AdminLayout>
  )
}
