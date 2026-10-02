import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import Composer from './Composer.jsx'
import './ChatArea.css'

export default function ChatArea({
  messages, busy, useSearch, setUseSearch, onSend, onUpload, notify
}) {
  const scrollRef = useRef(null)
  const dockRef = useRef(null)
  const [dockH, setDockH] = useState(130)

  // The composer floats over the thread; pad the thread by its live height.
  useLayoutEffect(() => {
    const el = dockRef.current
    if (!el) return
    const measure = () => setDockH(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  }, [messages, busy, dockH])

  const first = messages[0]
  const stamp = first
    ? new Date(first.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <>
      <div className="messages" ref={scrollRef} style={{ '--dock': `${dockH}px` }}>
        <div className="thread" role="log" aria-live="polite" aria-label="Conversation">
          {first && <div className="thread-stamp">Today {stamp}</div>}
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              tight={i > 0 && messages[i - 1].who === m.who}
              last={!messages[i + 1] || messages[i + 1].who !== m.who}
            />
          ))}
          {busy && <TypingIndicator />}
        </div>
      </div>

      <div className="dock" ref={dockRef}>
        <Composer
          busy={busy}
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          onSend={onSend}
          onUpload={onUpload}
          notify={notify}
        />
      </div>
    </>
  )
}
