import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import Icon from './Icon.jsx'
import Orb from './Orb.jsx'
import Sidebar from './Sidebar.jsx'
import ChatArea from './ChatArea.jsx'
import Toast from './Toast.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import './ChatLayout.css'

let counter = 0
// crypto.randomUUID needs a secure context, which breaks on LAN http URLs.
const uid = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`

const shortName = (name) => name.replace(/^\d{8}_\d{6}_/, '')

export default function ChatLayout({ username, onLogout }) {
  const [messages, setMessages] = useState(() => [{
    id: uid(),
    who: 'bot',
    text: `Good day${username ? `, ${username}` : ''}. JARVIS at your service. How may I assist you?`,
    ts: Date.now()
  }])
  const [busy, setBusy] = useState(false)
  const [useSearch, setUseSearch] = useState(false)
  const [files, setFiles] = useState([])
  const [profile, setProfile] = useState({ facts: [] })
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia('(min-width: 901px)').matches
  )
  const [toast, setToast] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const toastTimer = useRef(null)

  useEffect(() => {
    refreshFiles()
    refreshProfile()
    return () => clearTimeout(toastTimer.current)
  }, [])

  // A 401 anywhere means the session expired: go back to the lock screen.
  function handleAuthError(e) {
    if (e && e.status === 401) { onLogout(); return true }
    return false
  }

  async function refreshFiles() {
    try { setFiles(await api.files()) } catch (e) { handleAuthError(e) }
  }
  async function refreshProfile() {
    try { setProfile(await api.profile()) } catch (e) { handleAuthError(e) }
  }

  function notify(msg, kind = 'info') {
    clearTimeout(toastTimer.current)
    setToast({ msg, kind, id: uid() })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  function addBot(text, error = false) {
    setMessages(m => [...m, { id: uid(), who: 'bot', text, error, ts: Date.now() }])
  }

  async function sendMessage(text) {
    if (!text.trim() || busy) return
    setMessages(m => [...m, { id: uid(), who: 'user', text, ts: Date.now() }])
    setBusy(true)
    try {
      const data = await api.chat(text, useSearch)
      addBot(data.reply)
      speak(data.reply)
      refreshProfile()
    } catch (e) {
      if (handleAuthError(e)) return
      addBot(
        e.status
          ? e.message
          : "Can't reach the JARVIS server. Check that the backend is running.",
        true
      )
    } finally {
      setBusy(false)
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || text.length > 500) return
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.05
    window.speechSynthesis.speak(u)
  }

  async function uploadFile(file) {
    try {
      const data = await api.upload(file)
      const name = shortName(data.name)
      notify(`Uploaded ${name}`)
      addBot(`Saved ${name}. To ask about it, type /file ${name} followed by your question.`)
      refreshFiles()
    } catch (e) {
      if (handleAuthError(e)) return
      notify(e.status ? e.message : "Upload failed. Is the backend running?", 'error')
    }
  }

  async function clearHistory() {
    setConfirmClear(false)
    try {
      await api.clear()
      setMessages([{
        id: uid(), who: 'bot', ts: Date.now(),
        text: 'Conversation cleared. Ready for a fresh start.'
      }])
      notify('Conversation cleared')
    } catch (e) {
      if (!handleAuthError(e)) notify("Couldn't clear the conversation.", 'error')
    }
  }

  async function logout() {
    try { await api.logout() } catch {}
    onLogout()
  }

  const initial = (username || 'G').trim().charAt(0).toUpperCase()

  return (
    <div className="shell">
      {sidebarOpen && (
        <>
          <div className="scrim" onClick={() => setSidebarOpen(false)} />
          <Sidebar
            files={files}
            profile={profile}
            onUpload={uploadFile}
            onClear={() => setConfirmClear(true)}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <main className="main rim">
        <header className="topbar glass">
          <div className="topbar-side">
            <button
              className="round-btn"
              onClick={() => setSidebarOpen(s => !s)}
              aria-label={sidebarOpen ? 'Hide workspace' : 'Show workspace'}
              aria-pressed={sidebarOpen}
            >
              <Icon name="sidebar" size={20} />
            </button>
          </div>

          <div className="topbar-title">
            <Orb size={26} pulsing={busy} />
            <div className="titles">
              <span className="name">JARVIS</span>
              <span className="status">
                <span className={`dot${busy ? ' is-busy' : ''}`} />
                {busy ? 'Thinking…' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="topbar-side end">
            <span className="user-chip">
              <span className="avatar" aria-hidden="true">{initial}</span>
              <span className="user-name">{username || 'Guest'}</span>
            </span>
            <button className="round-btn" onClick={logout} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={19} />
            </button>
          </div>
        </header>

        <ChatArea
          messages={messages}
          busy={busy}
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          onSend={sendMessage}
          onUpload={uploadFile}
          notify={notify}
        />
      </main>

      <Toast toast={toast} />

      {confirmClear && (
        <ConfirmDialog
          title="Clear conversation?"
          message="JARVIS will forget this chat. Files and learned facts are kept."
          confirmLabel="Clear"
          onConfirm={clearHistory}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  )
}
