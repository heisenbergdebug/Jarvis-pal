# JARVIS Backend

Flask JSON API: auth, chat (Ollama, optional Gemini fallback), memory,
web search, code runner, file uploads. No UI lives here.

## Run

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env     # then edit it (or copy your existing .env here)
python app.py            # http://127.0.0.1:5000
```

Start the UI from `../frontend` (`npm run dev`).

## API

| Route | Notes |
|---|---|
| `POST /api/login`, `POST /api/logout`, `GET /api/me` | session auth |
| `POST /api/chat` | `{message, search}` -> `{reply}` |
| `POST /api/upload`, `GET /api/files`, `GET /uploads/<name>` | files |
| `GET /api/profile`, `POST /api/clear` | memory + history |

`python cli.py` still gives you the terminal version.

## Config (.env)

`GEMINI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FLASK_SECRET_KEY`,
`HOST`, `PORT`, `OLLAMA_MODEL`, and `CORS_ORIGINS` (only needed when the UI is
served from another origin).

Never commit `.env`, `data/` or `uploads/` (already in `.gitignore`).
