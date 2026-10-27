"""Independent RAG step component endpoints."""

import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.rag_component import (
    RagComponentCreate,
    RagComponentDocumentListResponse,
    RagComponentDocumentResponse,
    RagComponentListResponse,
    RagComponentResponse,
    RagComponentUpdate,
    RagComponentValidationResponse,
)
from app.services.rag_component_service import rag_component_service
from app.services.rag_step_registry import CATALOG_STEP_TYPES, CATALOG_TAB_LABELS, RAG_STEP_DEFINITIONS

router = APIRouter()


@router.get("/catalog")
async def list_catalog_types() -> dict:
    """Return all catalog step types with labels for UI tabs."""
    return {
        "items": [
            {
                "step_type": step,
                "label": RAG_STEP_DEFINITIONS[step]["label"],
                "tab_label": CATALOG_TAB_LABELS.get(step, RAG_STEP_DEFINITIONS[step]["label"]),
                "description": RAG_STEP_DEFINITIONS[step]["description"],
                "reference": RAG_STEP_DEFINITIONS[step]["reference"],
                "defaults": RAG_STEP_DEFINITIONS[step]["defaults"],
                "required_fields": RAG_STEP_DEFINITIONS[step]["required_fields"],
            }
            for step in CATALOG_STEP_TYPES
        ]
    }


@router.get("/{step_type}", response_model=RagComponentListResponse)
async def list_components(
    step_type: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentListResponse:
    if step_type not in CATALOG_STEP_TYPES:
        return RagComponentListResponse(items=[], total=0, step_type=step_type)
    components = await rag_component_service.list_components(db, user, step_type)
    items = [RagComponentResponse.model_validate(c) for c in components]
    return RagComponentListResponse(items=items, total=len(items), step_type=step_type)


@router.post("/{step_type}", response_model=RagComponentResponse, status_code=201)
async def create_component(
    step_type: str,
    data: RagComponentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentResponse:
    component = await rag_component_service.create_component(
        db, user, step_type, data.name, data.description, data.config
    )
    await db.commit()
    return RagComponentResponse.model_validate(component)


@router.get("/{step_type}/{component_id}", response_model=RagComponentResponse)
async def get_component(
    step_type: str,
    component_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    return RagComponentResponse.model_validate(component)


@router.patch("/{step_type}/{component_id}", response_model=RagComponentResponse)
async def update_component(
    step_type: str,
    component_id: uuid.UUID,
    data: RagComponentUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    component = await rag_component_service.update_component(
        db, component, data.name, data.description, data.config
    )
    await db.commit()
    return RagComponentResponse.model_validate(component)


@router.get("/data_ingestion/{component_id}/documents", response_model=RagComponentDocumentListResponse)
async def list_documents(
    component_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentDocumentListResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    docs = await rag_component_service.list_documents(db, component)
    items = [RagComponentDocumentResponse.model_validate(d) for d in docs]
    return RagComponentDocumentListResponse(items=items, total=len(items))


@router.post("/data_ingestion/{component_id}/upload", response_model=RagComponentDocumentListResponse)
async def upload_documents(
    component_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentDocumentListResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    records = await rag_component_service.upload_documents(db, component, files)
    await db.commit()
    items = [RagComponentDocumentResponse.model_validate(d) for d in records]
    return RagComponentDocumentListResponse(items=items, total=len(items))


@router.post("/{step_type}/{component_id}/validate", response_model=RagComponentValidationResponse)
async def validate_component(
    step_type: str,
    component_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentValidationResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    result = await rag_component_service.validate_component(db, component)
    await db.commit()
    return result


@router.post("/{step_type}/{component_id}/activate", response_model=RagComponentResponse)
async def activate_component(
    step_type: str,
    component_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RagComponentResponse:
    component = await rag_component_service.get_component(db, component_id, user)
    component = await rag_component_service.activate_component(db, component)
    await db.commit()
    return RagComponentResponse.model_validate(component)


@router.delete("/{step_type}/{component_id}", status_code=204)
async def delete_component(
    step_type: str,
    component_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    component = await rag_component_service.get_component(db, component_id, user)
    await rag_component_service.delete_component(db, component)
    await db.commit()
