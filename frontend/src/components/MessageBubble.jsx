import Icon from './Icon.jsx'
import './MessageBubble.css'

// Split on ``` fences: odd segments are code, even segments are prose.
function renderBody(text) {
  return text.split('```').map((part, i) => {
    if (i % 2 === 1) {
      const nl = part.indexOf('\n')
      const first = nl === -1 ? '' : part.slice(0, nl).trim()
      const hasLang = /^[a-zA-Z0-9+#_-]{1,20}$/.test(first)
      const code = (hasLang ? part.slice(nl + 1) : part).replace(/\n+$/, '')
      return <pre className="code" key={i}><code>{code}</code></pre>
    }
    const prose = part.replace(/^\n+|\n+$/g, '')
    return prose ? <span className="prose" key={i}>{prose}</span> : null
  })
}

// `tight`: continues the previous bubble from the same sender.
// `last`: closes a run of bubbles, so it gets the tail and the timestamp.
export default function MessageBubble({ message, tight, last }) {
  const isUser = message.who === 'user'
  const time = new Date(message.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div className={`msg ${isUser ? 'is-user' : 'is-bot'}${tight ? ' is-tight' : ''}${last ? ' has-tail' : ''}`}>
      <div className={`bubble${isUser ? '' : ' glass'}${message.error ? ' is-error' : ''}`}>
        {message.error && <Icon name="alert" size={17} className="bubble-icon" />}
        <div className="bubble-body">{renderBody(message.text)}</div>
      </div>
      {last && <time className="msg-time" dateTime={new Date(message.ts).toISOString()}>{time}</time>}
    </div>
  )
}
