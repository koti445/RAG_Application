"""RAG pipeline ORM models."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RagPipelineStatus(str, enum.Enum):
    DRAFT = "draft"
    DESIGNED = "designed"
    CONFIGURED = "configured"
    VALIDATED = "validated"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ExecutionStepStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [m.value for m in enum_cls]


from sqlalchemy import Enum as SAEnum


class RagPipeline(Base):
    __tablename__ = "rag_pipelines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RagPipelineStatus] = mapped_column(
        SAEnum(RagPipelineStatus, name="rag_pipeline_status", values_callable=_enum_values, native_enum=True),
        default=RagPipelineStatus.DRAFT,
        nullable=False,
    )
    graph_definition: Mapped[dict] = mapped_column(JSONB, default=dict)
    step_configs: Mapped[dict] = mapped_column(JSONB, default=dict)
    validation_results: Mapped[dict] = mapped_column(JSONB, default=dict)
    step_bindings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RagExecution(Base):
    __tablename__ = "rag_executions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pipeline_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_pipelines.id", ondelete="CASCADE"))
    query: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))


class RagExecutionStep(Base):
    __tablename__ = "rag_execution_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rag_executions.id", ondelete="CASCADE"))
    node_id: Mapped[str] = mapped_column(String(100), nullable=False)
    step_type: Mapped[str] = mapped_column(String(100), nullable=False)
    step_label: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[ExecutionStepStatus] = mapped_column(
        SAEnum(ExecutionStepStatus, name="execution_step_status", values_callable=_enum_values, native_enum=True),
        default=ExecutionStepStatus.PENDING,
        nullable=False,
    )
    config_snapshot: Mapped[dict] = mapped_column(JSONB, default=dict)
    input_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    output_summary: Mapped[dict] = mapped_column(JSONB, default=dict)
    reference_docs: Mapped[list] = mapped_column(JSONB, default=list)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    step_order: Mapped[int] = mapped_column(Integer, default=0)
