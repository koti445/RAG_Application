"""Pydantic schemas for independent RAG step components."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RagComponentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None


class RagComponentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None


class RagComponentResponse(BaseModel):
    id: uuid.UUID
    step_type: str
    name: str
    description: str | None
    config: dict[str, Any]
    status: str
    validation_errors: list[str]
    validation_warnings: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RagComponentListResponse(BaseModel):
    items: list[RagComponentResponse]
    total: int
    step_type: str


class RagComponentDocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_size: int | None
    mime_type: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RagComponentDocumentListResponse(BaseModel):
    items: list[RagComponentDocumentResponse]
    total: int


class RagComponentValidationResponse(BaseModel):
    id: uuid.UUID
    step_type: str
    status: str
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    reference: str | None
