import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import './Composer.css'

export default function Composer({ busy, useSearch, setUseSearch, onSend, onUpload, notify }) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const taRef = useRef(null)
  const fileRef = useRef(null)
  const recRef = useRef(null)

  // Auto-grow the textarea
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 176) + 'px'
  }, [text])

  useEffect(() => () => recRef.current?.abort?.(), [])

  const canSend = text.trim().length > 0 && !busy

  function submit() {
    if (!canSend) return
    onSend(text)
    setText('')
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  function toggleVoice() {
    if (listening) { recRef.current?.stop(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { notify('Voice input needs Chrome, Edge or Safari.', 'error'); return }
    const rec = new SR()
    rec.lang = navigator.language || 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setText(t => (t ? t + ' ' : '') + transcript)
      taRef.current?.focus()
    }
    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      notify(
        e.error === 'not-allowed'
          ? 'Allow microphone access to use voice input.'
          : `Voice input failed (${e.error}).`,
        'error'
      )
    }
    recRef.current = rec
    rec.start()
  }

  return (
    <>
      <div className="chips">
        <button
          className="chip"
          aria-pressed={useSearch}
          onClick={() => setUseSearch(!useSearch)}
        >
          <Icon name="globe" size={16} />
          Web search
        </button>
      </div>

      <div className="composer glass">
        <button
          className="round-btn"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a file"
          title="Attach a file"
        >
          <Icon name="plus" size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
            e.target.value = ''
          }}
        />

        <textarea
          ref={taRef}
          rows={1}
          placeholder="Message JARVIS"
          aria-label="Message JARVIS"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
        />

        <button
          className={`round-btn mic${listening ? ' is-listening' : ''}`}
          onClick={toggleVoice}
          aria-label={listening ? 'Stop listening' : 'Dictate a message'}
          aria-pressed={listening}
          title={listening ? 'Stop listening' : 'Dictate'}
        >
          <Icon name="mic" size={19} />
        </button>

        {text.trim() && (
          <button
            className="round-btn send"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            title="Send"
          >
            <Icon name="arrowUp" size={20} strokeWidth={2.6} />
          </button>
        )}
      </div>
    </>
  )
}
