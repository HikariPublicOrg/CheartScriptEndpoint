'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ClientState {
  online: boolean
  clientUsername: string | null
  refresh: () => void
}

const ClientContext = createContext<ClientState>({
  online: false,
  clientUsername: null,
  refresh: () => {},
})

export function ClientProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(false)
  const [clientUsername, setClientUsername] = useState<string | null>(null)

  async function check() {
    try {
      const res = await fetch('http://localhost:8953/health')
      if (!res.ok) throw new Error('offline')
      const data = await res.json()
      setOnline(true)
      setClientUsername(data.username || null)
    } catch {
      setOnline(false)
      setClientUsername(null)
    }
  }

  useEffect(() => {
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <ClientContext.Provider value={{ online, clientUsername, refresh: check }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  return useContext(ClientContext)
}
