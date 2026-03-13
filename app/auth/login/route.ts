import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url), { status: 302 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()

  if (profile?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url), { status: 302 })
  }

  return NextResponse.redirect(new URL('/dashboard', request.url), { status: 302 })
}
