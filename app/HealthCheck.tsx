'use client'

import { useClient } from './ClientContext'

export default function HealthCheck() {
  const { online, clientUsername } = useClient()

  return (
    <span className={`health-badge ${online ? 'online' : 'offline'}`}>
      {online && clientUsername ? clientUsername : 'Offline'}
    </span>
  )
}
