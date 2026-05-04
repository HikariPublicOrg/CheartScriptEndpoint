import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  const body = await request.json()
  const { script_name, version, desc, content } = body

  if (!script_name) {
    return Response.json(
      { error: 'Missing required field: script_name' },
      { status: 400 }
    )
  }

  const supabase = createClient(cookieStore)

  // content 为空时删除脚本
  if (!content) {
    await supabase.storage
      .from('cheart-script')
      .remove([`${username}/${script_name}.json`])

    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('script_name', script_name)
      .eq('script_author', username)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, deleted: true })
  }

  if (!version) {
    return Response.json(
      { error: 'Missing required field: version' },
      { status: 400 }
    )
  }

  // 上传脚本数据到 bucket
  const scriptData = JSON.stringify({
    name: script_name,
    script: content,
    author: username,
    version,
    description: desc,
  })
  const { error: uploadError } = await supabase.storage
    .from('cheart-script')
    .upload(`${username}/${script_name}.json`, new Blob([scriptData], { type: 'application/json' }), {
      upsert: true,
    })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  // 只存 script_name 和 script_author 到表
  const { data, error } = await supabase
    .from('scripts')
    .upsert({
      script_name,
      script_author: username,
    }, { onConflict: 'script_name,script_author' })
    .select()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, data })
}