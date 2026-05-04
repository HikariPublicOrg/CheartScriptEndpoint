import { NextRequest, NextResponse } from "next/server";
import { encryptData } from "../../username-secret";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: (process.env as any).GITHUB_CLIENT_ID,
            client_secret: (process.env as any).GITHUB_CLIENT_SECRET,
            code: code
        })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = (tokenData as any).access_token;

    if (!accessToken) {
        return new Response('Failed to obtain access token', { status: 400 });
    }

    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Next.js Server',
            'Accept': 'application/json'
        }
    });

    const userData = await userResponse.json();
    const username = (userData as any).login;
    if (!username) {
        return new Response('Failed to obtain user information', { status: 500 });
    }

    const jwt = await encryptData(username, (process.env as any).COOKIE_USERNAME_SECRET);

    const response = new NextResponse(null,{status:302,
        headers: {
            'Location': '/'
        }
    })
    response.cookies.set('authToken', jwt, {httpOnly:true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7})
    response.cookies.set('username',username, {secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7})
    response.cookies.delete('oauthState')

    return response;
}