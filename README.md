# JARVIS

```
jarvis-ai/
├── backend/    Flask API + AI brain + tools   (python app.py)
├── frontend/   React + Vite glass UI          (npm run dev)
└── README.md
```

## Quick start

Two terminals:

```bash
# 1. backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # or copy your existing .env into backend/
python app.py

# 2. frontend
cd frontend
npm install
npm run dev
```

Open http://127.0.0.1:5173 and sign in.

See `backend/README.md` and `frontend/README.md` for details.
