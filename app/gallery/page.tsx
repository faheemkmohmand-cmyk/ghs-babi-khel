import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GalleryPage() {
  const supabase = createClient()
  const { data: albums } = await supabase.from('gallery_albums').select('*, gallery_photos(id,url,caption)').eq('published', true).order('date', { ascending:false })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Gallery</span>
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl font-black text-slate-800 mb-2">🖼️ Photo Gallery</h1>
        <p className="text-slate-500 mb-8">Memories and moments from GHS Babi Khel</p>

        {!albums?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 text-center py-16">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-slate-400 font-semibold">Gallery coming soon</p>
          </div>
        ) : (
          <div className="space-y-10">
            {albums.map((album: any) => (
              <div key={album.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-xl font-black text-slate-800">{album.title}</h2>
                    <p className="text-slate-400 text-sm">{album.date} · {album.category}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">{album.gallery_photos?.length || 0} photos</span>
                </div>
                {album.description && <p className="text-slate-500 text-sm mb-4">{album.description}</p>}
                {album.gallery_photos?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {album.gallery_photos.map((photo: any) => (
                      <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden bg-slate-200 hover:scale-105 transition-transform cursor-pointer shadow-sm">
                        <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 py-10 text-center">
                    <p className="text-slate-400 text-sm">No photos in this album yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
