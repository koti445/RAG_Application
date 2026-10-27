"""Local file storage for data ingestion uploads."""

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import PROJECT_ROOT

UPLOAD_ROOT = PROJECT_ROOT / "data" / "uploads"


def _safe_filename(name: str) -> str:
    return Path(name).name.replace("..", "").strip() or "file"


def _extension_allowed(filename: str, allowed: list[str]) -> bool:
    ext = Path(filename).suffix.lstrip(".").lower()
    return ext in [a.lower().lstrip(".") for a in allowed]


async def save_uploaded_files(
    user_id: uuid.UUID,
    component_id: uuid.UUID,
    files: list[UploadFile],
    allowed_extensions: list[str],
    max_file_size_mb: int,
) -> list[dict]:
    """Save files to disk. Returns metadata dicts for DB records."""
    dest_dir = UPLOAD_ROOT / str(user_id) / str(component_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    max_bytes = max_file_size_mb * 1024 * 1024
    saved: list[dict] = []

    for upload in files:
        if not upload.filename:
            continue
        filename = _safe_filename(upload.filename)
        if not _extension_allowed(filename, allowed_extensions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed: {filename}. Allowed: {', '.join(allowed_extensions)}",
            )

        content = await upload.read()
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {filename} exceeds max size of {max_file_size_mb} MB",
            )

        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        path = dest_dir / unique_name
        path.write_bytes(content)

        saved.append(
            {
                "filename": filename,
                "storage_path": str(path.relative_to(PROJECT_ROOT)),
                "file_size": len(content),
                "mime_type": upload.content_type,
                "status": "stored",
            }
        )

    if not saved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid files provided")

    return saved
