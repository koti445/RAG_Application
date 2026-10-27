"""RAG pipeline request/response schemas."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class GraphDefinition(BaseModel):
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []


class RagPipelineCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    template_id: str | None = None
    configuration: dict[str, Any] | None = None
    activate: bool = False


class RagPipelineTestConnectionRequest(BaseModel):
    database_store: str
    store_type: str = "vector"


class RagPipelineTestConnectionResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int | None = None


class RagPipelineUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    status: str | None = None


class RagPipelineGraphUpdate(BaseModel):
    graph_definition: GraphDefinition


class RagStepConfigUpdate(BaseModel):
    step_type: str
    config: dict[str, Any]


class RagPipelineBindingsUpdate(BaseModel):
    """Bind catalog component IDs to pipeline steps, with optional runtime overrides."""
    bindings: dict[str, str] = Field(description="step_type -> component_id")
    runtime_overrides: dict[str, dict[str, Any]] = Field(default_factory=dict)


class StepValidationResult(BaseModel):
    step_type: str
    status: str
    errors: list[str] = []
    warnings: list[str] = []
    reference: str | None = None


class RagPipelineResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    status: str
    graph_definition: dict[str, Any]
    step_configs: dict[str, Any]
    step_bindings: dict[str, Any] = {}
    validation_results: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RagPipelineListResponse(BaseModel):
    items: list[RagPipelineResponse]
    total: int


class RagValidationResponse(BaseModel):
    pipeline_id: UUID
    is_valid: bool
    steps: list[StepValidationResult]
    can_activate: bool


class ExecutionStepTrace(BaseModel):
    node_id: str
    step_type: str
    step_label: str | None
    status: str
    config_snapshot: dict[str, Any] = {}
    input_summary: dict[str, Any] = {}
    output_summary: dict[str, Any] = {}
    reference_docs: list[dict[str, Any]] = []
    latency_ms: int | None = None
    error_message: str | None = None


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1)


class RagQueryResponse(BaseModel):
    execution_id: UUID
    answer: str
    sources: list[dict[str, Any]] = []
    trace: list[ExecutionStepTrace] = []
