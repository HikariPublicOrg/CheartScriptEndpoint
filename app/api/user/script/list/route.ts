import { NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 10 //cache for 10 seconds

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('script_author',cookieStore.get('username')?.value)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}