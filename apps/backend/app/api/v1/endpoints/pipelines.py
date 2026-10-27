"""Pipeline graph and version endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/{pipeline_id}/graph")
async def get_graph(pipeline_id: str) -> dict:
    """Get React Flow graph definition for a pipeline version."""
    return {"pipeline_id": pipeline_id, "nodes": [], "edges": []}


@router.put("/{pipeline_id}/graph")
async def save_graph(pipeline_id: str, graph: dict) -> dict:
    """Persist visual designer graph (nodes + edges)."""
    return {"pipeline_id": pipeline_id, "saved": True}


@router.get("/{pipeline_id}/versions")
async def list_versions(pipeline_id: str) -> dict:
    """List pipeline version history."""
    return {"pipeline_id": pipeline_id, "versions": []}
