-- RAG Pipelines: design, configuration, validation, execution traces

CREATE TYPE rag_pipeline_status AS ENUM ('draft', 'designed', 'configured', 'validated', 'active', 'archived');
CREATE TYPE rag_step_status AS ENUM ('pending', 'valid', 'invalid', 'skipped');
CREATE TYPE execution_step_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

CREATE TABLE rag_pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status rag_pipeline_status NOT NULL DEFAULT 'draft',
    graph_definition JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    step_configs JSONB NOT NULL DEFAULT '{}',
    validation_results JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rag_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES rag_pipelines(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE rag_execution_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES rag_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    step_type VARCHAR(100) NOT NULL,
    step_label VARCHAR(255),
    status execution_step_status NOT NULL DEFAULT 'pending',
    config_snapshot JSONB DEFAULT '{}',
    input_summary JSONB DEFAULT '{}',
    output_summary JSONB DEFAULT '{}',
    reference_docs JSONB DEFAULT '[]',
    latency_ms INT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    step_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_rag_pipelines_status ON rag_pipelines(status);
CREATE INDEX idx_rag_pipelines_created_by ON rag_pipelines(created_by);
CREATE INDEX idx_rag_executions_pipeline ON rag_executions(pipeline_id);
CREATE INDEX idx_rag_execution_steps_execution ON rag_execution_steps(execution_id);
