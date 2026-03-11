'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Album = { id: string; title: string; description: string; date: string; category: string }
type Photo = { id: string; url: string; caption: string; album_id: string }

export default function GalleryPage() {
  const supabase = createClient()
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('gallery_albums').select('*').eq('published', true).order('date', { ascending: false })
      setAlbums(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function openAlbum(album: Album) {
    setSelectedAlbum(album)
    setLoadingPhotos(true)
    const { data } = await supabase.from('gallery_photos').select('*').eq('album_id', album.id).order('created_at')
    setPhotos(data || [])
    setLoadingPhotos(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm hidden sm:block" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/ Gallery</span>
        {selectedAlbum ? (
          <button onClick={() => setSelectedAlbum(null)} className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← All Albums</button>
        ) : (
          <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold">← Home</Link>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {!selectedAlbum ? (
          <>
            <h1 className="font-display text-3xl font-black text-slate-800 mb-2">🖼️ Photo Gallery</h1>
            <p className="text-slate-500 mb-8">{albums.length} albums · Memories from GHS Babi Khel</p>
            {loading ? (
              <div className="text-center py-16 text-slate-400"><div className="text-5xl mb-3 animate-pulse">🖼️</div>Loading albums...</div>
            ) : albums.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
                <div className="text-5xl mb-3">🖼️</div><p className="text-slate-400 font-semibold">Gallery coming soon</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map(a => (
                  <button key={a.id} onClick={() => openAlbum(a)}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-left hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform">🖼️</div>
                    <div className="p-3">
                      <h3 className="font-black text-slate-800 text-sm leading-snug">{a.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{a.date} · {a.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div>
                <h1 className="font-display text-3xl font-black text-slate-800">{selectedAlbum.title}</h1>
                <p className="text-slate-500">{selectedAlbum.date} · {selectedAlbum.category}</p>
                {selectedAlbum.description && <p className="text-slate-500 mt-1 text-sm">{selectedAlbum.description}</p>}
              </div>
            </div>
            {loadingPhotos ? (
              <div className="text-center py-16 text-slate-400">Loading photos...</div>
            ) : photos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
                <div className="text-5xl mb-3">📷</div><p className="text-slate-400 font-semibold">No photos in this album yet</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {photos.map(p => (
                  <button key={p.id} onClick={() => setLightbox(p)}
                    className="break-inside-avoid block w-full rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform shadow-sm hover:shadow-xl">
                    <img src={p.url} alt={p.caption || ''} className="w-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.9)'}}
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption || ''} className="w-full rounded-2xl max-h-[80vh] object-contain"/>
            {lightbox.caption && <p className="text-white/60 text-sm text-center mt-3">{lightbox.caption}</p>}
            <button onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full text-slate-800 font-black text-lg flex items-center justify-center shadow-lg">×</button>
          </div>
        </div>
      )}
    </div>
  )
}
