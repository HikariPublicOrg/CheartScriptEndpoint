import { type NextRequest } from 'next/server'

const CLIENT_BASE = 'http://localhost:8953'

async function proxy(request: NextRequest, path: string) {
  const url = new URL(request.url)
  const target = `${CLIENT_BASE}/${path}${url.search}`

  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(5000) })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return Response.json({ error: 'Client offline' }, { status: 502 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxy(request, path.join('/'))
}
