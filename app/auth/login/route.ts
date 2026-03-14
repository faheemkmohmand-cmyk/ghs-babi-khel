import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email    = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const origin   = new URL(request.url).origin

  if (!email || !password) {
    return NextResponse.redirect(`${origin}/login?error=missing`, { status: 302 })
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=invalid`, { status: 302 })
  }

  let destination = '/dashboard'
  try {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profile?.role === 'admin') destination = '/admin'
  } catch (_) {}

  return NextResponse.redirect(`${origin}${destination}`, { status: 302 })
} 
