export default function Orb({ size = 44, pulsing = false }) {
  return (
    <span
      className={`orb${pulsing ? ' is-pulsing' : ''}`}
      style={{ '--s': `${size}px` }}
      aria-hidden="true"
    />
  )
}
