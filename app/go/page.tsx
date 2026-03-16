import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function GoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → go to login
  if (!user) {
    redirect('/login')
  }

  // Logged in → check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}
