// Thin wrapper around the Flask backend (../../backend). Cookies travel
// automatically, so login state is preserved between requests.
//
// Dev:   BASE is '' and Vite proxies /api -> http://127.0.0.1:5000
// Split: set VITE_API_URL to the backend origin (needs CORS, see backend/app.py)
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  }
  const res = await fetch(BASE + path, {
    credentials: 'include',
    ...options,
    headers
  })

  let data = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => null)
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  // session
  login: (username, password) =>
    request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  logout: () => request('/api/logout', { method: 'POST' }),

  // Returns { logged_in, username } or null when signed out / unreachable.
  me: async () => {
    try {
      const data = await request('/api/me')
      return data && data.logged_in === true ? data : null
    } catch {
      return null
    }
  },

  // chat
  chat: (message, search = false) =>
    request('/api/chat', { method: 'POST', body: JSON.stringify({ message, search }) }),

  clear: () => request('/api/clear', { method: 'POST' }),

  // files + memory
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/api/upload', { method: 'POST', body: fd })
  },

  files: () => request('/api/files'),
  profile: () => request('/api/profile'),

  fileUrl: (url) => BASE + url
}
