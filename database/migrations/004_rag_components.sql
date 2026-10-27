-- Independent RAG step entities (catalog): create, configure, validate per step type

CREATE TYPE rag_component_status AS ENUM ('draft', 'validated', 'active', 'archived');

CREATE TABLE rag_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    status rag_component_status NOT NULL DEFAULT 'draft',
    validation_errors JSONB NOT NULL DEFAULT '[]',
    validation_warnings JSONB NOT NULL DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_components_step_type ON rag_components(step_type);
CREATE INDEX idx_rag_components_status ON rag_components(status);
CREATE INDEX idx_rag_components_created_by ON rag_components(created_by);

-- Files uploaded via data_ingestion components
CREATE TABLE rag_component_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id UUID NOT NULL REFERENCES rag_components(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_component_documents_component ON rag_component_documents(component_id);

-- Pipeline bindings: reference validated catalog entities per step
ALTER TABLE rag_pipelines ADD COLUMN IF NOT EXISTS step_bindings JSONB NOT NULL DEFAULT '{}';
