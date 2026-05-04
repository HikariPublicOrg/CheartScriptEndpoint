import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ScriptManager from './ScriptManager'

export default async function Home() {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  if (!username) {
    redirect('/api/auth/oauth')
  }

  return (
    <div className="container">
      <script dangerouslySetInnerHTML={{ __html: 'console.log("page script loaded")' }} />
      <header>
        <h1>Cheart Script</h1>
        <span className="user-badge">{username}</span>
      </header>
      <ScriptManager />
    </div>
  )
}
