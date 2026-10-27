"""Batch evaluation endpoints."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/datasets")
async def upload_dataset() -> dict:
    """Upload golden Q&A dataset (CSV/JSON)."""
    return {"dataset_id": "pending"}


@router.post("/runs")
async def start_eval_run() -> dict:
    """Start batch evaluation job against a pipeline version."""
    return {"run_id": "pending", "status": "queued"}


@router.get("/runs/{run_id}")
async def get_eval_results(run_id: str) -> dict:
    """Get evaluation run metrics and per-question results."""
    return {"run_id": run_id, "metrics": {}, "results": []}
