import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      { status: 302 }
    )
  }

  // Get or create profile
  let role = 'student'
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', data.user.id).single()

  if (!profile) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
      role: 'student'
    })
  } else {
    role = profile.role || 'student'
  }

  const destination = role === 'admin' ? '/admin' : '/dashboard'
  return NextResponse.redirect(new URL(destination, request.url), { status: 302 })
}
