"""CRUD and validation for independent RAG step components."""

import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag_component import RagComponent, RagComponentDocument, RagComponentStatus
from app.models.user import User
from app.schemas.rag_component import RagComponentValidationResponse
from app.services.file_storage_service import save_uploaded_files
from app.services.rag_step_registry import RAG_STEP_DEFINITIONS, validate_step_config


class RagComponentService:
    async def list_components(
        self, db: AsyncSession, user: User, step_type: str
    ) -> list[RagComponent]:
        result = await db.scalars(
            select(RagComponent)
            .where(RagComponent.step_type == step_type, RagComponent.created_by == user.id)
            .order_by(RagComponent.updated_at.desc())
        )
        return list(result.all())

    async def get_component(
        self, db: AsyncSession, component_id: uuid.UUID, user: User
    ) -> RagComponent:
        component = await db.get(RagComponent, component_id)
        if not component or component.created_by != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Component not found")
        return component

    async def create_component(
        self,
        db: AsyncSession,
        user: User,
        step_type: str,
        name: str,
        description: str | None = None,
        config: dict | None = None,
    ) -> RagComponent:
        if step_type not in RAG_STEP_DEFINITIONS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown step type: {step_type}")

        defaults = RAG_STEP_DEFINITIONS[step_type]["defaults"]
        merged_config = {**defaults, **(config or {})}

        component = RagComponent(
            step_type=step_type,
            name=name,
            description=description,
            config=merged_config,
            status=RagComponentStatus.DRAFT,
            created_by=user.id,
        )
        db.add(component)
        await db.flush()
        return component

    async def update_component(
        self,
        db: AsyncSession,
        component: RagComponent,
        name: str | None = None,
        description: str | None = None,
        config: dict | None = None,
    ) -> RagComponent:
        if name is not None:
            component.name = name
        if description is not None:
            component.description = description
        if config is not None:
            component.config = {**component.config, **config}
        component.status = RagComponentStatus.DRAFT
        component.validation_errors = []
        component.validation_warnings = []
        await db.flush()
        return component

    async def list_documents(
        self, db: AsyncSession, component: RagComponent
    ) -> list[RagComponentDocument]:
        result = await db.scalars(
            select(RagComponentDocument)
            .where(RagComponentDocument.component_id == component.id)
            .order_by(RagComponentDocument.created_at.desc())
        )
        return list(result.all())

    async def upload_documents(
        self,
        db: AsyncSession,
        component: RagComponent,
        files: list[UploadFile],
    ) -> list[RagComponentDocument]:
        if component.step_type != "data_ingestion":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploads only for data ingestion")

        config = component.config or {}
        allowed = config.get("allowed_extensions", ["pdf", "docx", "txt", "csv"])
        max_mb = int(config.get("max_file_size_mb", 50))

        saved_meta = await save_uploaded_files(
            component.created_by, component.id, files, allowed, max_mb
        )

        records: list[RagComponentDocument] = []
        for meta in saved_meta:
            doc = RagComponentDocument(component_id=component.id, **meta)
            db.add(doc)
            records.append(doc)

        component.status = RagComponentStatus.DRAFT
        await db.flush()
        return records

    async def validate_component(
        self, db: AsyncSession, component: RagComponent
    ) -> RagComponentValidationResponse:
        val_status, errors, warnings = validate_step_config(component.step_type, component.config)
        definition = RAG_STEP_DEFINITIONS.get(component.step_type, {})

        if component.step_type == "data_ingestion":
            doc_count = await db.scalar(
                select(func.count())
                .select_from(RagComponentDocument)
                .where(RagComponentDocument.component_id == component.id)
            )
            if not doc_count:
                errors.append("Upload at least one document before validating")
                val_status = "invalid"

        component.validation_errors = errors
        component.validation_warnings = warnings
        component.status = (
            RagComponentStatus.VALIDATED if val_status == "valid" else RagComponentStatus.DRAFT
        )
        await db.flush()

        return RagComponentValidationResponse(
            id=component.id,
            step_type=component.step_type,
            status=val_status,
            is_valid=val_status == "valid",
            errors=errors,
            warnings=warnings,
            reference=definition.get("reference"),
        )

    async def activate_component(self, db: AsyncSession, component: RagComponent) -> RagComponent:
        if component.status != RagComponentStatus.VALIDATED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Component must be validated before activation",
            )
        component.status = RagComponentStatus.ACTIVE
        await db.flush()
        return component

    async def delete_component(self, db: AsyncSession, component: RagComponent) -> None:
        await db.delete(component)
        await db.flush()

    async def count_by_type(self, db: AsyncSession, user: User, step_type: str) -> int:
        result = await db.scalar(
            select(func.count())
            .select_from(RagComponent)
            .where(RagComponent.step_type == step_type, RagComponent.created_by == user.id)
        )
        return result or 0


rag_component_service = RagComponentService()
