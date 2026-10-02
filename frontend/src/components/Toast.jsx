import Icon from './Icon.jsx'
import './Toast.css'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`toast glass glass-thick is-${toast.kind}`} role="status" key={toast.id}>
      <Icon name={toast.kind === 'error' ? 'alert' : 'check'} size={18} />
      <span>{toast.msg}</span>
    </div>
  )
}
