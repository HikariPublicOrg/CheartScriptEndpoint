import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 120 //cache for 2 minutes

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .limit(100)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}