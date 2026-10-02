import { useEffect, useState } from 'react'
import Wallpaper from './components/Wallpaper.jsx'
import Orb from './components/Orb.jsx'
import LockScreen from './components/LockScreen.jsx'
import ChatLayout from './components/ChatLayout.jsx'
import { api } from './lib/api.js'

export default function App() {
  // state: 'checking' | 'out' | 'in'
  const [auth, setAuth] = useState({ state: 'checking', username: '' })

  useEffect(() => {
    api.me().then(me =>
      setAuth(me ? { state: 'in', username: me.username || '' } : { state: 'out', username: '' })
    )
  }, [])

  return (
    <>
      <Wallpaper />

      {auth.state === 'checking' && (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Orb size={56} pulsing />
        </div>
      )}

      {auth.state === 'out' && (
        <LockScreen onLogin={(name) => setAuth({ state: 'in', username: name })} />
      )}

      {auth.state === 'in' && (
        <ChatLayout
          username={auth.username}
          onLogout={() => setAuth({ state: 'out', username: '' })}
        />
      )}
    </>
  )
}
