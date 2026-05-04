import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { decryptData } from './app/api/username-secret'
import { env } from 'process'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
      response.cookies.set('authToken', authToken, {httpOnly:true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/'})
      response.cookies.set('username', username, {secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/'})
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
      response.cookies.set('oauthState', state, {httpOnly:true, secure: true, sameSite: 'lax', maxAge: 60 * 5, path: '/'})
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，排除以下:
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico, sitemap.xml, robots.txt (元数据文件)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}