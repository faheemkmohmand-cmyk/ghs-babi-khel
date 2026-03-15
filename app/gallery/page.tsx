import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GalleryPage({ searchParams }: { searchParams: { album?:string } }) {
  const supabase = createClient()
  const { data: settings } = await (supabase as any).from('school_settings').select('logo_url,short_name').limit(1).maybeSingle()
  const { data: albums } = await (supabase as any).from('gallery_albums').select('*').order('created_at',{ascending:false})
  const selAlbumId = searchParams.album
  const selAlbum = albums?.find(a=>a.id===selAlbumId)
  const { data: photos } = selAlbumId
    ? await (supabase as any).from('gallery_photos').select('*').eq('album_id', selAlbumId).order('created_at')
    : { data: [] }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="text-white px-4 py-3 flex items-center gap-3" style={{background:'#0a1628'}}>
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url
            ? <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover"/>
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:'linear-gradient(135deg,#014d26,#4ade80)'}}>🏫</div>}
          <span className="font-bold text-sm" style={{fontFamily:'Georgia,serif'}}>GHS Babi Khel</span>
        </Link>
        <span className="text-white/30 ml-2">/ Gallery</span>
        {selAlbum && <><span className="text-white/20">/</span><span className="text-white/50 text-sm truncate">{selAlbum.name}</span></>}
        <Link href="/" className="ml-auto text-white/50 hover:text-white text-sm">← Home</Link>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!selAlbumId ? (
          <>
            <h1 className="text-3xl font-black text-slate-800 mb-2" style={{fontFamily:'Georgia,serif'}}>🖼️ Photo Gallery</h1>
            <p className="text-slate-500 mb-8">Memories from GHS Babi Khel events and activities</p>
            {!albums?.length ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-slate-500 font-semibold">Gallery photos coming soon</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map(a=>(
                  <Link key={a.id} href={`/gallery?album=${a.id}`} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      {a.cover_url
                        ? <img src={a.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">🖼️</div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-black text-slate-800 text-sm leading-snug">{a.name}</h3>
                      {a.description && <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{a.description}</p>}
                      {a.event_date && <p className="text-slate-400 text-xs mt-1">📅 {a.event_date}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Link href="/gallery" className="text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">← All Albums</Link>
              <span className="text-slate-300">/</span>
              <h1 className="font-black text-slate-800 text-xl" style={{fontFamily:'Georgia,serif'}}>{selAlbum?.name}</h1>
            </div>
            {selAlbum?.description && <p className="text-slate-500 mb-6">{selAlbum.description}</p>}
            {!photos?.length ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-slate-500 font-semibold">No photos in this album yet</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
                {photos.map(p=>(
                  <div key={p.id} className="break-inside-avoid">
                    <img src={p.url} className="w-full rounded-2xl border border-slate-100 hover:shadow-md transition-all hover:scale-[1.02]" alt={p.caption||''} loading="lazy" />
                    {p.caption && <p className="text-xs text-slate-400 text-center mt-1 px-1">{p.caption}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
