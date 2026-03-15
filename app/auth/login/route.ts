import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as any)
          )
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

  // Get or create profile
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
      role = 'student'
    } else {
      role = profile.role || 'student'
    }
  } catch {
    role = 'student'
  }

  const destination = role === 'admin' ? '/admin' : '/dashboard'
  
  // Create response with redirect
  const response = NextResponse.redirect(new URL(destination, request.url), { status: 302 })
  
  // Copy all auth cookies to the response
  cookieStore.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
  })

  return response
}
