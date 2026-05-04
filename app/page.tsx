import { cookies } from 'next/headers'
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  if(!username) {
    redirect('/api/auth/oauth')
  }

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta charSet="UTF-8" />
        <title>Cheart Script</title>
      </head>
      <body>
        <div>
          <h1>Welcome back, {username}!</h1>
        </div>
      </body>
    </html>
  );
}