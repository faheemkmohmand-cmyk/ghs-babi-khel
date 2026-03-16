import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Simple cookie-based auth check - no network calls, never crashes
  const path = request.nextUrl.pathname
  
  // Only protect /dashboard and /admin routes
  if (!path.startsWith('/dashboard') && !path.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie (any cookie starting with sb-)
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => 
    c.name.includes('sb-') && c.name.includes('-auth-token') && c.value.length > 10
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
