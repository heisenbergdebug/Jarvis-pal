import { useRef } from 'react'
import Icon from './Icon.jsx'
import { api } from '../lib/api.js'
import './Sidebar.css'

const shortName = (name) => name.replace(/^\d{8}_\d{6}_/, '')

function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Sidebar({ files, profile, onUpload, onClear, onClose }) {
  const fileRef = useRef(null)

  function onPick(e) {
    const f = e.target.files?.[0]
    if (f) onUpload(f)
    e.target.value = ''
  }

  const facts = (profile.facts || []).slice(-6).reverse()

  return (
    <aside className="sidebar glass" aria-label="Workspace">
      <div className="sidebar-head">
        <h2>Workspace</h2>
        <button className="round-btn sidebar-close" onClick={onClose} aria-label="Close workspace">
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="sidebar-body">
        <section className="section">
          <div className="section-head">
            <h3>Files</h3>
            <button className="text-btn" onClick={() => fileRef.current?.click()}>Add</button>
            <input ref={fileRef} type="file" hidden onChange={onPick} />
          </div>
          <div className="group">
            {files.length === 0 ? (
              <div className="row empty">
                <span>Nothing attached yet. Use the + in the message bar.</span>
              </div>
            ) : (
              files.map(f => (
                <a
                  key={f.name}
                  className="row has-tile is-link"
                  href={api.fileUrl(f.url || `/uploads/${f.name}`)}
                  target="_blank"
                  rel="noreferrer"
                  title={shortName(f.name)}
                >
                  <span className="tile blue"><Icon name="file" size={17} /></span>
                  <span className="row-main">
                    <span className="row-title">{shortName(f.name)}</span>
                    <span className="row-sub">{formatSize(f.size)}</span>
                  </span>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h3>Memory</h3>
          </div>
          <div className="group">
            {facts.length === 0 ? (
              <div className="row empty">
                <span>Nothing yet. Tell JARVIS something about yourself and it will remember.</span>
              </div>
            ) : (
              facts.map((f, i) => (
                <div className="row has-tile" key={i}>
                  <span className="tile violet"><Icon name="sparkle" size={17} /></span>
                  <span className="row-main"><span className="row-text">{f}</span></span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="sidebar-foot">
        <div className="group">
          <button className="row row-danger" onClick={onClear}>
            <Icon name="trash" size={18} />
            Clear conversation
          </button>
        </div>
      </div>
    </aside>
  )
}
