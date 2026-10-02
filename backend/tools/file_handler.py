"""File upload + text extraction."""

import os
from pathlib import Path
from datetime import datetime

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def save_upload(file_storage):
    """Save an uploaded file and return the path."""
    if not file_storage or not file_storage.filename:
        return None
    safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_storage.filename}"
    path = UPLOAD_DIR / safe_name
    file_storage.save(str(path))
    return str(path)


def extract_text(file_path):
    """Extract readable text from common file types."""
    path = Path(file_path)
    ext = path.suffix.lower()

    try:
        if ext == ".txt" or ext == ".md" or ext == ".py" or ext == ".js" \
                or ext == ".html" or ext == ".css" or ext == ".json":
            return path.read_text(encoding="utf-8", errors="ignore")[:10000]

        if ext == ".pdf":
            from PyPDF2 import PdfReader
            reader = PdfReader(str(path))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return text[:10000]

        if ext == ".docx":
            from docx import Document
            doc = Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs)[:10000]

        if ext in (".png", ".jpg", ".jpeg", ".gif", ".webp"):
            return f"[Image file: {path.name}, size: {path.stat().st_size} bytes]"

        return f"[Unsupported file type: {ext}]"

    except Exception as e:
        return f"[Error reading file: {e}]"


def list_uploads():
    """List all uploaded files."""
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file() and not f.name.startswith("."):
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })
    return sorted(files, key=lambda x: x["modified"], reverse=True)
