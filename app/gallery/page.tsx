'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Album = { id: string; title: string; description: string; cover_url: string; date: string; category: string }
type Photo = { id: string; album_id: string; url: string; caption: string }

const CATEGORY_ICONS: Record<string, string> = {
  'Sports Day': '⚽', 'Exam': '📝', 'Teachers': '👨‍🏫', 'Programs': '🎭',
  'Parties': '🎉', 'Memories': '💫', 'Tour': '🚌', 'Graduation': '🎓',
  'Cultural': '🎨', 'General': '📷',
}

export default function GalleryPage() {
  const supabase = createClient()
  const [albums, setAlbums] = useState<Album[]>([])
  const [selAlbum, setSelAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [lightbox, setLightbox] = useState<{ photo: Photo; index: number } | null>(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('gallery_albums').select('*')
        .eq('published', true).order('date', { ascending: false })
      setAlbums(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function openAlbum(album: Album) {
    setSelAlbum(album)
    setLoadingPhotos(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const { data } = await supabase.from('gallery_photos').select('*')
      .eq('album_id', album.id).order('created_at')
    setPhotos(data || [])
    setLoadingPhotos(false)
  }

  function goBack() {
    setSelAlbum(null)
    setPhotos([])
    setLightbox(null)
  }

  function nextPhoto() {
    if (!lightbox) return
    const next = (lightbox.index + 1) % photos.length
    setLightbox({ photo: photos[next], index: next })
  }

  function prevPhoto() {
    if (!lightbox) return
    const prev = (lightbox.index - 1 + photos.length) % photos.length
    setLightbox({ photo: photos[prev], index: prev })
  }

  const categories = ['All', ...Array.from(new Set(albums.map(a => a.category) as string[]))]
  const filteredAlbums = filter === 'All' ? albums : albums.filter(a => a.category === filter)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 text-white px-4 py-3 flex items-center gap-3 shadow-lg" style={{ background: '#0a1628' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg,#014d26,#4ade80)' }}>🏫</div>
          <span className="font-bold text-sm hidden sm:block">GHS Babi Khel</span>
        </Link>
        <span className="text-white/30">/</span>
        {selAlbum ? (
          <>
            <button onClick={goBack} className="text-white/50 hover:text-white text-sm font-semibold transition-colors">Gallery</button>
            <span className="text-white/30">/</span>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">{selAlbum.title}</span>
            <button onClick={goBack} className="ml-auto text-white/50 hover:text-white text-sm font-semibold transition-colors">← Back</button>
          </>
        ) : (
          <>
            <span className="text-white text-sm font-bold">Gallery</span>
            <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm font-semibold transition-colors">← Home</Link>
          </>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!selAlbum ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-display text-4xl font-black text-slate-800 mb-2">📸 Photo Gallery</h1>
              <p className="text-slate-500 text-lg">{albums.length} albums · Memories from GHS Babi Khel</p>
            </div>

            {/* Category filter */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      filter === cat
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
                    }`}>
                    {CATEGORY_ICONS[cat] || '📷'} {cat}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-slate-200 rounded-2xl aspect-square animate-pulse"/>
                ))}
              </div>
            ) : filteredAlbums.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 text-center py-20">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-slate-500 font-bold text-lg">No albums yet</p>
                <p className="text-slate-400 text-sm mt-1">Check back soon for photos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAlbums.map(album => (
                  <button key={album.id} onClick={() => openAlbum(album)}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-left hover:shadow-xl transition-all hover:-translate-y-1 group">
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden relative">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-slate-300">
                          {CATEGORY_ICONS[album.category] || '📷'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-lg">View Photos →</span>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        {CATEGORY_ICONS[album.category] || '📷'} {album.category}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-black text-slate-800 text-sm leading-snug">{album.title}</h3>
                      <p className="text-slate-400 text-xs mt-1">{album.date}</p>
                      {album.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{album.description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Album view */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{CATEGORY_ICONS[selAlbum.category] || '📷'}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selAlbum.category}</span>
                </div>
                <h1 className="font-display text-3xl font-black text-slate-800">{selAlbum.title}</h1>
                <p className="text-slate-400 mt-1">{selAlbum.date} · {photos.length} photos</p>
                {selAlbum.description && <p className="text-slate-600 mt-1">{selAlbum.description}</p>}
              </div>
              <button onClick={goBack}
                className="border-2 border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-all">
                ← All Albums
              </button>
            </div>

            {loadingPhotos ? (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="break-inside-avoid bg-slate-200 rounded-2xl animate-pulse"
                    style={{ height: `${150 + (i % 3) * 80}px` }}/>
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 text-center py-20">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-slate-500 font-bold">No photos in this album yet</p>
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {photos.map((photo, index) => (
                  <button key={photo.id}
                    onClick={() => setLightbox({ photo, index })}
                    className="break-inside-avoid block w-full rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform shadow-sm hover:shadow-xl">
                    <img src={photo.url} alt={photo.caption || ''}
                      className="w-full object-cover"
                      loading="lazy"/>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}>
          {/* Close */}
          <button className="absolute top-4 right-4 text-white/60 hover:text-white text-4xl font-bold z-10 w-12 h-12 flex items-center justify-center">×</button>
          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/50 text-sm font-bold">
            {lightbox.index + 1} / {photos.length}
          </div>
          {/* Prev */}
          {photos.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prevPhoto() }}
              className="absolute left-4 text-white/60 hover:text-white text-5xl font-bold z-10 w-12 h-12 flex items-center justify-center">‹</button>
          )}
          {/* Image */}
          <img src={lightbox.photo.url} alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}/>
          {/* Next */}
          {photos.length > 1 && (
            <button onClick={e => { e.stopPropagation(); nextPhoto() }}
              className="absolute right-4 text-white/60 hover:text-white text-5xl font-bold z-10 w-12 h-12 flex items-center justify-center">›</button>
          )}
          {lightbox.photo.caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm text-center px-4">{lightbox.photo.caption}</p>
          )}
        </div>
      )}
    </div>
  )
}
