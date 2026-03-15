import { createClient } from '@/lib/supabase/server'

export async function SchoolLogo({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const supabase = createClient()
  const { data } = await supabase.from('school_settings').select('logo_url').order('updated_at', { ascending: false }).limit(1)
  const logoUrl = data?.[0]?.logo_url || ''

  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' }

  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-green-900 to-green-500 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {logoUrl
        ? <img src={logoUrl} alt="School Logo" className="w-full h-full object-cover"/>
        : <span className="text-white font-black">GHS</span>
      }
    </div>
  )
}
