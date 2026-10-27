"""Project management endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_projects() -> dict:
    """List projects for current user's organization."""
    return {"items": []}


@router.post("")
async def create_project() -> dict:
    """Create a new RAG project."""
    return {"message": "Not implemented"}


@router.get("/{project_id}")
async def get_project(project_id: str) -> dict:
    """Get project details."""
    return {"id": project_id}
