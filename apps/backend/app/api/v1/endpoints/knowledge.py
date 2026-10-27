"""Knowledge base and document ingestion endpoints."""

from fastapi import APIRouter, UploadFile

router = APIRouter()


@router.get("/{project_id}/documents")
async def list_documents(project_id: str) -> dict:
    """List documents in project knowledge base."""
    return {"project_id": project_id, "documents": []}


@router.post("/{project_id}/upload")
async def upload_documents(project_id: str, files: list[UploadFile]) -> dict:
    """Upload documents and enqueue ingestion job."""
    return {"project_id": project_id, "job_id": "pending", "file_count": len(files)}


@router.get("/jobs/{job_id}")
async def get_ingestion_status(job_id: str) -> dict:
    """Get async ingestion job status."""
    return {"job_id": job_id, "status": "pending"}
