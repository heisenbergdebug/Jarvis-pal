# JARVIS Frontend

React + Vite UI with an iOS-style glass design: lock-screen login, floating
glass top bar and message bar, iMessage-style bubbles, Settings-style
workspace panel. Dark only.

## Run

```bash
cd frontend
npm install        # first time only
npm run dev        # http://127.0.0.1:5173
```

The backend must be running too (see `../backend`). In dev, Vite proxies
`/api` and `/uploads` to `http://127.0.0.1:5000`, so cookies just work.

| Variable | Purpose |
|---|---|
| `VITE_PROXY_TARGET` | Change the dev proxy target (default `http://127.0.0.1:5000`) |
| `VITE_API_URL` | Only if the UI is hosted apart from the API (needs CORS) |

## Build

```bash
npm run build      # outputs to frontend/dist
```

If `frontend/dist` exists, the Flask backend serves it at `/`, so
`python app.py` alone is enough for a single-server setup.

## Structure

```
src/
├── main.jsx / App.jsx        entry + auth gate
├── lib/api.js                fetch wrapper for the backend
├── styles/global.css         design tokens, wallpaper, glass, buttons, lists
└── components/
    ├── LockScreen            login (clock + glass card)
    ├── ChatLayout            shell, top bar, toast + confirm wiring
    ├── Sidebar               files + memory + clear (sheet on mobile)
    ├── ChatArea / Composer   thread, floating message bar, voice, search chip
    ├── MessageBubble / TypingIndicator
    └── Icon, Orb, Wallpaper, Toast, ConfirmDialog
```
