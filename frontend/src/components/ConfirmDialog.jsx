import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

// iOS-style alert: centred glass card, two actions split by a hairline.
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="dialog-scrim" onClick={onCancel}>
      <div
        className="dialog glass glass-thick"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-body">
          <h2 id="dialog-title">{title}</h2>
          <p id="dialog-msg">{message}</p>
        </div>
        <div className="dialog-actions">
          <button ref={cancelRef} className="dialog-btn" onClick={onCancel}>Cancel</button>
          <button className="dialog-btn is-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
