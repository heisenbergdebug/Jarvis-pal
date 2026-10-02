import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import Icon from './Icon.jsx'
import Orb from './Orb.jsx'
import './LockScreen.css'

function formatTime(d) {
  // "9:41" - the time without AM/PM, like the iOS lock screen
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
    .formatToParts(d)
    .filter(p => p.type !== 'dayPeriod')
    .map(p => p.value)
    .join('')
    .trim()
}

function formatDate(d) {
  return new Intl.DateTimeFormat([], { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

export default function LockScreen({ onLogin }) {
  const [now, setNow] = useState(() => new Date())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (loading) return
    setErr('')
    setLoading(true)
    try {
      await api.login(username.trim(), password)
      onLogin(username.trim())
    } catch (e) {
      setErr(
        e.status === 401
          ? 'Wrong username or password.'
          : "Can't reach the JARVIS server. Check that the backend is running."
      )
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setLoading(false)
    }
  }

  return (
    <div className="lock">
      <div className="lock-clock">
        <div className="lock-date">{formatDate(now)}</div>
        <div className="lock-time">{formatTime(now)}</div>
      </div>

      <form className="lock-card glass glass-thick" onSubmit={submit}>
        <div className="lock-brand">
          <Orb size={46} />
          <div>
            <h1>JARVIS</h1>
            <p>Just A Rather Very Intelligent System</p>
          </div>
        </div>

        <div className={`group${shake ? ' shake' : ''}`}>
          <label className="row">
            <Icon name="user" size={20} />
            <span className="sr-only">Username</span>
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
            />
          </label>
          <label className="row">
            <Icon name="lock" size={20} />
            <span className="sr-only">Password</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {err && <p className="lock-err" role="alert">{err}</p>}

        <button className="btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
