"""Playground query and A/B comparison endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class PlaygroundQuery(BaseModel):
    project_id: str
    pipeline_version_id: str
    query: str
    conversation_id: str | None = None


class CompareRequest(BaseModel):
    project_id: str
    query: str
    variant_a_version_id: str
    variant_b_version_id: str


@router.post("/query")
async def run_query(body: PlaygroundQuery) -> dict:
    """Run a single RAG query against a pipeline version."""
    return {
        "answer": "",
        "sources": [],
        "trace": [],
        "conversation_id": body.conversation_id,
    }


@router.post("/compare")
async def compare_variants(body: CompareRequest) -> dict:
    """A/B test: run same query against two pipeline configs in parallel."""
    return {
        "query": body.query,
        "variant_a": {"answer": "", "latency_ms": 0, "sources": []},
        "variant_b": {"answer": "", "latency_ms": 0, "sources": []},
    }


@router.post("/vote")
async def vote_winner() -> dict:
    """Record user preference for A/B comparison."""
    return {"recorded": True}
