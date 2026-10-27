"""RAG pipeline endpoints: CRUD, design, config, validation, query."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rag_pipeline import (
    RagPipelineBindingsUpdate,
    RagPipelineCreate,
    RagPipelineGraphUpdate,
    RagPipelineListResponse,
    RagPipelineResponse,
    RagPipelineTestConnectionRequest,
    RagPipelineTestConnectionResponse,
    RagPipelineUpdate,
    RagQueryRequest,
    RagQueryResponse,
    RagStepConfigUpdate,
    RagValidationResponse,
)
from app.services.rag_step_registry import PIPELINE_REQUIRED_BINDINGS
from app.services.rag_pipeline_service import rag_pipeline_service
from app.services.rag_step_registry import ORDERED_STEPS, RAG_STEP_DEFINITIONS

router = APIRouter()


@router.get("/steps")
async def list_step_definitions() -> dict:
    """Return all RAG step definitions with defaults and validation references."""
    return {
        "steps": [
            {
                "type": step,
                "label": RAG_STEP_DEFINITIONS[step]["label"],
                "description": RAG_STEP_DEFINITIONS[step]["description"],
                "reference": RAG_STEP_DEFINITIONS[step]["reference"],
                "defaults": RAG_STEP_DEFINITIONS[step]["defaults"],
                "required_fields": RAG_STEP_DEFINITIONS[step]["required_fields"],
            }
            for step in ORDERED_STEPS
        ]
    }


@router.get("/builder/required-steps")
async def list_required_builder_steps() -> dict:
    """Steps required for pipeline creation wizard with binding + runtime field metadata."""
    runtime_fields: dict[str, list[str]] = {
        "retrieval": ["strategy", "top_k", "top_p", "score_threshold"],
        "generation": ["temperature", "top_p"],
        "chunking": ["strategy", "chunk_size", "chunk_overlap"],
    }
    return {
        "steps": [
            {
                "step_type": step,
                "label": RAG_STEP_DEFINITIONS[step]["label"],
                "description": RAG_STEP_DEFINITIONS[step]["description"],
                "reference": RAG_STEP_DEFINITIONS[step]["reference"],
                "required": True,
                "runtime_fields": runtime_fields.get(step, []),
            }
            for step in PIPELINE_REQUIRED_BINDINGS
        ]
    }


@router.get("", response_model=RagPipelineListResponse)
async def list_rag_pipelines(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineListResponse:
    pipelines = await rag_pipeline_service.list_pipelines(db, user)
    items = [RagPipelineResponse.model_validate(p) for p in pipelines]
    return RagPipelineListResponse(items=items, total=len(items))


@router.post("", response_model=RagPipelineResponse, status_code=201)
async def create_rag_pipeline(
    data: RagPipelineCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.create_pipeline(
        db,
        user,
        data.name,
        data.description,
        configuration=data.configuration,
        activate=data.activate,
    )
    await db.commit()
    return RagPipelineResponse.model_validate(pipeline)


@router.post("/test-connection", response_model=RagPipelineTestConnectionResponse)
async def test_database_connection(
    data: RagPipelineTestConnectionRequest,
    user: User = Depends(get_current_user),
) -> RagPipelineTestConnectionResponse:
    result = await rag_pipeline_service.test_database_connection(data.database_store, data.store_type)
    return RagPipelineTestConnectionResponse(**result)


@router.get("/{pipeline_id}", response_model=RagPipelineResponse)
async def get_rag_pipeline(
    pipeline_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    return RagPipelineResponse.model_validate(pipeline)


@router.patch("/{pipeline_id}", response_model=RagPipelineResponse)
async def update_rag_pipeline(
    pipeline_id: uuid.UUID,
    data: RagPipelineUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    if data.name is not None:
        pipeline.name = data.name
    if data.description is not None:
        pipeline.description = data.description
    await db.commit()
    await db.refresh(pipeline)
    return RagPipelineResponse.model_validate(pipeline)


@router.put("/{pipeline_id}/graph", response_model=RagPipelineResponse)
async def save_graph(
    pipeline_id: uuid.UUID,
    data: RagPipelineGraphUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    pipeline = await rag_pipeline_service.update_graph(db, pipeline, data.graph_definition.model_dump())
    await db.commit()
    return RagPipelineResponse.model_validate(pipeline)


@router.put("/{pipeline_id}/bindings", response_model=RagPipelineResponse)
async def update_pipeline_bindings(
    pipeline_id: uuid.UUID,
    data: RagPipelineBindingsUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    pipeline = await rag_pipeline_service.update_bindings(
        db, pipeline, user, data.bindings, data.runtime_overrides
    )
    await db.commit()
    return RagPipelineResponse.model_validate(pipeline)


@router.put("/{pipeline_id}/steps/{step_type}", response_model=RagPipelineResponse)
async def update_step_config(
    pipeline_id: uuid.UUID,
    step_type: str,
    data: RagStepConfigUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    pipeline = await rag_pipeline_service.update_step_config(db, pipeline, step_type, data.config)
    await db.commit()
    return RagPipelineResponse.model_validate(pipeline)


@router.post("/{pipeline_id}/validate", response_model=RagValidationResponse)
async def validate_pipeline(
    pipeline_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagValidationResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    result = await rag_pipeline_service.validate_pipeline(db, pipeline, user)
    await db.commit()
    return result


@router.post("/{pipeline_id}/activate", response_model=RagPipelineResponse)
async def activate_pipeline(
    pipeline_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagPipelineResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    pipeline = await rag_pipeline_service.activate_pipeline(db, pipeline)
    await db.commit()
    return RagPipelineResponse.model_validate(pipeline)


@router.post("/{pipeline_id}/query", response_model=RagQueryResponse)
async def query_pipeline(
    pipeline_id: uuid.UUID,
    data: RagQueryRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagQueryResponse:
    pipeline = await rag_pipeline_service.get_pipeline(db, pipeline_id, user)
    result = await rag_pipeline_service.run_query(db, pipeline, user, data.query)
    await db.commit()
    return result
