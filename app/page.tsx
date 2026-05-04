import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClientProvider } from './ClientContext'
import ScriptManager from './ScriptManager'
import HealthCheck from './HealthCheck'

export default async function Home() {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  if (!username) {
    redirect('/api/auth/oauth')
  }

  return (
    <ClientProvider>
      <div className="container">
        <header>
          <h1>Cheart Script</h1>
          <div className="header-badges">
            <span className="user-badge">{username}</span>
            <HealthCheck />
          </div>
        </header>
        <ScriptManager />
      </div>
    </ClientProvider>
  )
}
