import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const response = NextResponse.redirect(new URL('/dashboard', request.url), { status: 302 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options as any,
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 * 24 * 7,
            })
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      { status: 302 }
    )
  }

  // Get role
  let role = 'student'
  try {
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
  } catch { role = 'student' }

  // Redirect based on role
  const url = new URL(role === 'admin' ? '/admin' : '/dashboard', request.url)
  return NextResponse.redirect(url, { status: 302 })
}
