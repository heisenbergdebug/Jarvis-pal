"""
JARVIS backend - Flask JSON API with admin authentication.

This folder is API-only. The UI lives in ../frontend (React + Vite).

Routes:
  /api/*            JSON API used by the frontend
  /uploads/<file>   uploaded files (login required)
  /                 serves ../frontend/dist if you've built the frontend,
                    otherwise a small JSON status message

Dev workflow:
  Terminal 1:  cd backend  && python app.py        (Flask on :5000)
  Terminal 2:  cd frontend && npm run dev          (Vite on :5173, proxies /api)
"""

import os
from pathlib import Path
from functools import wraps

from flask import (
    Flask, request, jsonify, session,
    send_from_directory, abort
)
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

from jarvis_brain import JarvisBrain
from tools import web_search, code_executor, file_handler

load_dotenv()

# ----- paths ---------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
# Optional: a production build of the frontend (npm run build)
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

# ----- app -----------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "change-this-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB uploads

# CORS is only needed if the frontend is served from a different origin than
# the API (e.g. VITE_API_URL points here). With the default Vite proxy setup
# everything is same-origin and this does nothing.
try:
    from flask_cors import CORS
    _origins = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if o.strip()
    ]
    CORS(app, origins=_origins, supports_credentials=True)
except ImportError:
    pass

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Sugumar")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "I_AM_BATMAN")
ADMIN_PASSWORD_HASH = generate_password_hash(ADMIN_PASSWORD)

# Active brain sessions per user (in-memory)
brains = {}


def get_brain(username=None):
    username = username or session.get("username") or ADMIN_USERNAME
    if username not in brains:
        brains[username] = JarvisBrain(username=username)
    return brains[username]


# ----- auth ----------------------------------------------------------------
def api_login_required(f):
    """Return 401 JSON so the frontend can react cleanly."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return jsonify({"error": "unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


def check_credentials(username, password):
    return username == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, password)


# ----- auth API ------------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not check_credentials(username, password):
        return jsonify({"error": "Invalid credentials"}), 401
    session["logged_in"] = True
    session["username"] = username
    return jsonify({"status": "ok", "username": username})


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"status": "logged_out"})


@app.route("/api/me")
def api_me():
    if session.get("logged_in"):
        return jsonify({"logged_in": True, "username": session.get("username")})
    return jsonify({"logged_in": False}), 401


# ----- chat API ------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
@api_login_required
def api_chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    use_search = bool(data.get("search", False))
    if not message:
        return jsonify({"error": "Empty message"}), 400

    brain = get_brain()
    try:
        prompt = message
        if use_search:
            results = web_search.search_web(message, max_results=5)
            prompt = (
                f"User asked: {message}\n\nWeb search results:\n{results}\n\n"
                f"Answer using these results."
            )

        lower = message.lower()
        if lower.startswith("/code ") or "run this code:" in lower:
            code = message.split(":", 1)[-1] if ":" in message else message[6:]
            output = code_executor.run_python(code)
            prompt = f"User asked to run code. Here is the output:\n{output}\n\nExplain the result."

        if "/file " in lower:
            fname = message.split("/file ", 1)[-1].strip().split()[0]
            target = next((f for f in UPLOADS_DIR.iterdir() if f.name.endswith(fname)), None)
            if target:
                content = file_handler.extract_text(str(target))
                prompt = f"User asked about file '{fname}'. Content:\n\n{content}\n\nAnswer based on this."

        reply = brain.chat(prompt)
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/upload", methods=["POST"])
@api_login_required
def api_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    path = file_handler.save_upload(request.files["file"])
    if not path:
        return jsonify({"error": "No file"}), 400
    return jsonify({"path": path, "name": Path(path).name, "url": f"/uploads/{Path(path).name}"})


@app.route("/api/files")
@api_login_required
def api_files():
    items = file_handler.list_uploads()
    for it in items:
        if "name" in it and "url" not in it:
            it["url"] = f"/uploads/{it['name']}"
    return jsonify(items)


@app.route("/api/profile")
@api_login_required
def api_profile():
    return jsonify(get_brain().get_profile())


@app.route("/api/clear", methods=["POST"])
@api_login_required
def api_clear():
    get_brain().clear_history()
    return jsonify({"status": "cleared"})


# ----- uploaded files ------------------------------------------------------
@app.route("/uploads/<path:filename>")
@api_login_required
def uploaded_file(filename):
    return send_from_directory(UPLOADS_DIR, filename)


# ----- optional: serve the built frontend ----------------------------------
@app.route("/")
def index():
    if (FRONTEND_DIST / "index.html").exists():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({
        "service": "JARVIS API",
        "status": "ok",
        "hint": "Start the UI with: cd frontend && npm run dev",
    })


@app.route("/<path:path>")
def frontend_files(path):
    # Unknown /api/* paths must stay JSON 404s, never the SPA shell.
    if path.startswith("api/") or not (FRONTEND_DIST / "index.html").exists():
        abort(404)
    if (FRONTEND_DIST / path).is_file():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


# ----- main ----------------------------------------------------------------
if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    print(f"\n[JARVIS] API running at http://{host}:{port}")
    print(f"   Login username: {ADMIN_USERNAME} (password is from your .env)")
    if (FRONTEND_DIST / "index.html").exists():
        print("[JARVIS] serving built frontend from ../frontend/dist\n")
    else:
        print("[JARVIS] UI: cd ../frontend && npm run dev  (http://127.0.0.1:5173)\n")
    app.run(host=host, port=port, debug=True)
