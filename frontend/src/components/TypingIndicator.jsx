import './TypingIndicator.css'

export default function TypingIndicator() {
  return (
    <div className="typing" role="status" aria-label="JARVIS is thinking">
      <div className="typing-bubble glass" aria-hidden="true">
        <span /><span /><span />
      </div>
    </div>
  )
}
