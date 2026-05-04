import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { decryptData } from './app/api/username-secret'
import { env } from 'process'
import { createClient } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase session refresh
  const supabaseResponse = createClient(request)

  if(pathname.startsWith('/api/user')) {
    const authToken = request.cookies.get('authToken')?.value

    if(!authToken) {
      return NextResponse.json({
        message: 'Unauthorized'
      },{status: 401, statusText: 'Unauthorized'})
    }

    const username = await decryptData(authToken,(env as any).COOKIE_USERNAME_SECRET)

    if(!username) {
      request.cookies.delete('authToken')
      request.cookies.delete('username')
      return NextResponse.json({
        message: 'Unauthorized'
      },{status: 401, statusText: 'Unauthorized'})
    }else {
      const response = NextResponse.next();
      response.cookies.set('authToken', authToken, {httpOnly:true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7})
      response.cookies.set('username', username, {secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7})
      return response;
    }
  }

  if(pathname.startsWith('/api/auth')){
    if(pathname.startsWith('/api/auth/oauth')){
      const state = crypto.randomUUID()
      const response = NextResponse.next({status:302})
      const clientId = (env as any).GITHUB_CLIENT_ID;
      const redirectUri = (env as any).GITHUB_CALLBACK_URL;
      const scope = 'read:user public_repo';
      const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: scope,
      });
      response.cookies.set('oauthState', state, {httpOnly:true, secure: true, sameSite: 'lax', maxAge: 60 * 5})
      response.headers.set('Location', `https://github.com/login/oauth/authorize?${params.toString()}`)

      return response
    }
    if(pathname.startsWith('/api/auth/callback')) {
      const url = new URL(request.url)
      const state = url.searchParams.get('state')
      const code = url.searchParams.get('code')

      const lastState = request.cookies.get('oauthState')?.value
      
      if(!state || !code || state !== lastState) {
        return NextResponse.json({
          message: 'Invalid state or code'
        }, {status: 400, statusText: 'Bad Request'})
      }
    }
  }

  if(pathname.startsWith('/api/getscript')){
    const searchParams = request.nextUrl.searchParams
    const scriptName = searchParams.get('name')
    const author = searchParams.get('author')

    if(!scriptName || !author) {
      return NextResponse.json({
        message: 'Missing name or author parameter'
      }, {status: 400, statusText: 'Bad Request'})
    }

    const bucket = (env as any).BUCKET_BASE_URL
    const scriptUrl = `${bucket}/${author}/${scriptName}.bsh`

    try {
      const scriptResponse = await fetch(scriptUrl)
      if(!scriptResponse.ok) {
        return NextResponse.json({
          message: 'Script not found'
        }, {status: 404, statusText: 'Not Found'})
      }
      return new NextResponse(scriptResponse.body, {
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        }
      })
    }catch(error) {
      return NextResponse.json({
        message: 'Error fetching script'
      }, {status: 500, statusText: 'Internal Server Error'})
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，排除以下:
     * - _next (所有 Next.js 内部路径，包括 HMR WebSocket)
     * - favicon.ico, sitemap.xml, robots.txt (元数据文件)
     */
    '/((?!_next|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}