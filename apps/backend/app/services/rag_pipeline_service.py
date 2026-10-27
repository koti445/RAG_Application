"""RAG pipeline CRUD, validation, and query execution with live traces."""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag_pipeline import ExecutionStepStatus, RagExecution, RagExecutionStep, RagPipeline, RagPipelineStatus
from app.models.user import User
from app.schemas.rag_pipeline import (
    ExecutionStepTrace,
    RagQueryResponse,
    RagValidationResponse,
    StepValidationResult,
)
from app.models.rag_component import RagComponentStatus
from app.services.rag_component_service import rag_component_service
from app.services.rag_step_registry import (
    ORDERED_STEPS,
    PIPELINE_REQUIRED_BINDINGS,
    RAG_STEP_DEFINITIONS,
    validate_step_config,
)


class RagPipelineService:
    async def list_pipelines(self, db: AsyncSession, user: User) -> list[RagPipeline]:
        result = await db.scalars(
            select(RagPipeline)
            .where(RagPipeline.created_by == user.id)
            .order_by(RagPipeline.updated_at.desc())
        )
        return list(result)

    async def get_pipeline(self, db: AsyncSession, pipeline_id: uuid.UUID, user: User) -> RagPipeline:
        pipeline = await db.get(RagPipeline, pipeline_id)
        if not pipeline or pipeline.created_by != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RAG pipeline not found")
        return pipeline

    async def create_pipeline(
        self,
        db: AsyncSession,
        user: User,
        name: str,
        description: str | None,
        configuration: dict[str, Any] | None = None,
        activate: bool = False,
    ) -> RagPipeline:
        default_configs = {step: RAG_STEP_DEFINITIONS[step]["defaults"] for step in ORDERED_STEPS}
        if configuration:
            for step_type, config in configuration.items():
                if not isinstance(config, dict):
                    continue
                if step_type in RAG_STEP_DEFINITIONS:
                    default_configs[step_type] = {**RAG_STEP_DEFINITIONS[step_type]["defaults"], **config}
                else:
                    default_configs[step_type] = config

        pipeline = RagPipeline(
            name=name,
            description=description,
            created_by=user.id,
            step_configs=default_configs,
            step_bindings={},
            graph_definition={"nodes": [], "edges": []},
            validation_results={},
            status=RagPipelineStatus.CONFIGURED if configuration else RagPipelineStatus.DRAFT,
        )
        db.add(pipeline)
        await db.flush()

        if configuration:
            validation = await self.validate_pipeline(db, pipeline, user)
            if activate and validation.is_valid:
                pipeline.status = RagPipelineStatus.ACTIVE
            elif validation.is_valid:
                pipeline.status = RagPipelineStatus.VALIDATED

        await db.refresh(pipeline)
        return pipeline

    async def test_database_connection(self, database_store: str, store_type: str) -> dict[str, Any]:
        """Test database store connectivity (simulated; wire to real clients later)."""
        supported = {"pgvector", "pinecone", "chromadb", "azure_ai_search", "qdrant"}
        if database_store not in supported:
            return {"success": False, "message": f"Unsupported database store: {database_store}", "latency_ms": None}
        if store_type not in ("vector", "graph"):
            return {"success": False, "message": f"Store type '{store_type}' is not yet available", "latency_ms": None}
        return {
            "success": True,
            "message": f"Successfully connected to {database_store} ({store_type} mode)",
            "latency_ms": 42,
        }

    async def update_graph(self, db: AsyncSession, pipeline: RagPipeline, graph: dict) -> RagPipeline:
        pipeline.graph_definition = graph
        if pipeline.status == RagPipelineStatus.DRAFT:
            pipeline.status = RagPipelineStatus.DESIGNED
        await db.flush()
        await db.refresh(pipeline)
        return pipeline

    async def update_step_config(
        self, db: AsyncSession, pipeline: RagPipeline, step_type: str, config: dict[str, Any]
    ) -> RagPipeline:
        if step_type not in RAG_STEP_DEFINITIONS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown step: {step_type}")

        configs = dict(pipeline.step_configs or {})
        configs[step_type] = {**RAG_STEP_DEFINITIONS[step_type]["defaults"], **config}
        pipeline.step_configs = configs

        if pipeline.status in (RagPipelineStatus.DRAFT, RagPipelineStatus.DESIGNED):
            pipeline.status = RagPipelineStatus.CONFIGURED

        await db.flush()
        await db.refresh(pipeline)
        return pipeline

    async def update_bindings(
        self,
        db: AsyncSession,
        pipeline: RagPipeline,
        user: User,
        bindings: dict[str, str],
        runtime_overrides: dict[str, dict[str, Any]] | None = None,
    ) -> RagPipeline:
        overrides = runtime_overrides or {}
        configs = dict(pipeline.step_configs or {})
        stored_bindings: dict[str, str] = {}

        for step_type, component_id_str in bindings.items():
            if step_type not in RAG_STEP_DEFINITIONS:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown step: {step_type}")
            try:
                component_id = uuid.UUID(component_id_str)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid component id for {step_type}")

            component = await rag_component_service.get_component(db, component_id, user)
            if component.step_type != step_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Component {component.name} is not a {step_type} entity",
                )

            stored_bindings[step_type] = str(component_id)
            configs[step_type] = {
                **RAG_STEP_DEFINITIONS[step_type]["defaults"],
                **component.config,
                **overrides.get(step_type, {}),
                "_component_id": str(component_id),
                "_component_name": component.name,
            }

        pipeline.step_bindings = stored_bindings
        pipeline.step_configs = configs
        if pipeline.status in (RagPipelineStatus.DRAFT, RagPipelineStatus.DESIGNED):
            pipeline.status = RagPipelineStatus.CONFIGURED
        await db.flush()
        await db.refresh(pipeline)
        return pipeline

    async def validate_pipeline(self, db: AsyncSession, pipeline: RagPipeline, user: User | None = None) -> RagValidationResponse:
        configs = pipeline.step_configs or {}
        bindings = pipeline.step_bindings or {}
        steps: list[StepValidationResult] = []
        all_valid = True

        for step_type in PIPELINE_REQUIRED_BINDINGS:
            errors: list[str] = []
            warnings: list[str] = []
            config = configs.get(step_type, RAG_STEP_DEFINITIONS[step_type]["defaults"])
            step_status, cfg_errors, cfg_warnings = validate_step_config(step_type, config)
            errors.extend(cfg_errors)
            warnings.extend(cfg_warnings)

            if step_type in bindings and user:
                try:
                    component = await rag_component_service.get_component(
                        db, uuid.UUID(bindings[step_type]), user
                    )
                    if component.status not in (RagComponentStatus.VALIDATED, RagComponentStatus.ACTIVE):
                        errors.append(
                            f"{component.name} must be validated before use (current: {component.status.value})"
                        )
                    if component.validation_errors:
                        errors.extend(component.validation_errors)
                    warnings.extend(component.validation_warnings or [])
                except HTTPException:
                    errors.append(f"Bound component for {step_type} not found")
            elif step_type not in bindings:
                warnings.append(
                    f"Using inline configuration for {RAG_STEP_DEFINITIONS[step_type]['label']} (no catalog binding)"
                )

            if errors:
                step_status = "invalid"
            if step_status != "valid" or errors:
                all_valid = False
            steps.append(
                StepValidationResult(
                    step_type=step_type,
                    status="valid" if not errors else "invalid",
                    errors=errors,
                    warnings=warnings,
                    reference=RAG_STEP_DEFINITIONS[step_type]["reference"],
                )
            )

        for step_type in ORDERED_STEPS:
            if step_type in PIPELINE_REQUIRED_BINDINGS:
                continue
            config = configs.get(step_type, RAG_STEP_DEFINITIONS[step_type]["defaults"])
            step_status, errors, warnings = validate_step_config(step_type, config)
            if step_type == "reranking" and not config.get("enabled"):
                step_status = "valid"
            elif step_status != "valid":
                all_valid = False
            steps.append(
                StepValidationResult(
                    step_type=step_type,
                    status=step_status,
                    errors=errors,
                    warnings=warnings,
                    reference=RAG_STEP_DEFINITIONS[step_type]["reference"],
                )
            )

        validation_dict = {
            "is_valid": all_valid,
            "validated_at": datetime.now(timezone.utc).isoformat(),
            "steps": [s.model_dump() for s in steps],
        }
        pipeline.validation_results = validation_dict
        if all_valid:
            pipeline.status = RagPipelineStatus.VALIDATED

        await db.flush()
        return RagValidationResponse(
            pipeline_id=pipeline.id,
            is_valid=all_valid,
            steps=steps,
            can_activate=all_valid,
        )

    async def activate_pipeline(self, db: AsyncSession, pipeline: RagPipeline) -> RagPipeline:
        validation = pipeline.validation_results or {}
        if not validation.get("is_valid"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pipeline must be validated first")
        pipeline.status = RagPipelineStatus.ACTIVE
        await db.flush()
        await db.refresh(pipeline)
        return pipeline

    async def run_query(
        self, db: AsyncSession, pipeline: RagPipeline, user: User, query: str
    ) -> RagQueryResponse:
        """Execute RAG query with simulated step-by-step trace (live visualization data)."""
        configs = pipeline.step_configs or {}
        execution = RagExecution(pipeline_id=pipeline.id, query=query, created_by=user.id, status="running")
        db.add(execution)
        await db.flush()

        trace: list[ExecutionStepTrace] = []
        all_sources: list[dict[str, Any]] = []
        step_order = 0

        for step_type in ORDERED_STEPS:
            if step_type == "reranking" and not configs.get(step_type, {}).get("enabled"):
                continue

            definition = RAG_STEP_DEFINITIONS[step_type]
            config = configs.get(step_type, definition["defaults"])
            step_order += 1

            step_record = RagExecutionStep(
                execution_id=execution.id,
                node_id=f"node-{step_type}",
                step_type=step_type,
                step_label=definition["label"],
                status=ExecutionStepStatus.RUNNING,
                config_snapshot=config,
                step_order=step_order,
                started_at=datetime.now(timezone.utc),
            )
            db.add(step_record)
            await db.flush()

            output, refs, latency = self._simulate_step(step_type, config, query)

            step_record.status = ExecutionStepStatus.COMPLETED
            step_record.output_summary = output
            step_record.reference_docs = refs
            step_record.latency_ms = latency
            step_record.completed_at = datetime.now(timezone.utc)
            await db.flush()

            if refs:
                all_sources = refs
            trace.append(
                ExecutionStepTrace(
                    node_id=step_record.node_id,
                    step_type=step_type,
                    step_label=definition["label"],
                    status="completed",
                    config_snapshot=config,
                    output_summary=output,
                    reference_docs=refs,
                    latency_ms=latency,
                )
            )

        answer = (
            f"[Simulated] Based on your pipeline configuration, here is a response to: \"{query}\". "
            f"Retrieved using {configs.get('retrieval', {}).get('strategy', 'semantic')} search "
            f"with top_k={configs.get('retrieval', {}).get('top_k', 5)}."
        )
        execution.answer = answer
        execution.status = "completed"
        execution.completed_at = datetime.now(timezone.utc)
        await db.flush()

        return RagQueryResponse(execution_id=execution.id, answer=answer, sources=all_sources, trace=trace)

    def _simulate_step(
        self, step_type: str, config: dict[str, Any], query: str
    ) -> tuple[dict[str, Any], list[dict[str, Any]], int]:
        """Simulate step output for live visualization (replace with real executors later)."""
        latency_map = {
            "data_ingestion": 20,
            "knowledge_base": 12,
            "chunking": 45,
            "embedding": 120,
            "vector_store": 30,
            "retrieval": 85,
            "reranking": 60,
            "memory": 8,
            "generation": 450,
            "guardrails": 15,
        }
        refs: list[dict[str, Any]] = []

        if step_type == "chunking":
            return {
                "strategy": config.get("strategy"),
                "chunks_produced": 12,
                "avg_chunk_size": config.get("chunk_size"),
            }, refs, latency_map[step_type]

        if step_type == "embedding":
            return {
                "model": config.get("model"),
                "dimensions": config.get("dimensions"),
                "vectors_created": 12,
            }, refs, latency_map[step_type]

        if step_type == "vector_store":
            return {
                "provider": config.get("provider"),
                "collection": config.get("collection_name"),
                "metric": config.get("distance_metric"),
            }, refs, latency_map[step_type]

        if step_type == "retrieval":
            refs = [
                {"document_id": "doc-1", "chunk_text": "Sample retrieved chunk about the query topic.", "score": 0.92},
                {"document_id": "doc-2", "chunk_text": "Additional context from knowledge base.", "score": 0.87},
            ]
            return {
                "strategy": config.get("strategy"),
                "top_k": config.get("top_k"),
                "chunks_retrieved": len(refs),
            }, refs, latency_map[step_type]

        if step_type == "reranking":
            return {"model": config.get("model"), "reranked_count": config.get("top_n", 3)}, refs, latency_map[step_type]

        if step_type == "generation":
            return {"model": config.get("model"), "temperature": config.get("temperature"), "tokens": 156}, refs, latency_map[step_type]

        return {"configured": True, "step": step_type}, refs, latency_map.get(step_type, 20)


rag_pipeline_service = RagPipelineService()
