# RAG Platform — Workflows & Sequence Diagrams

## 1. Login → Home

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Auth API
    participant DB as PostgreSQL

    U->>FE: Enter credentials
    FE->>API: POST /auth/login
    API->>DB: Validate user
    DB-->>API: User record
    API-->>FE: access_token + refresh_token
    FE->>FE: Store tokens (httpOnly cookie)
    FE-->>U: Redirect to /home
    U->>FE: View dashboard
    FE->>API: GET /projects (Bearer token)
    API-->>FE: Project list
```

---

## 2. Create RAG Project & Open Designer

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Pipeline API
    participant DB as PostgreSQL

    U->>FE: New Project
    FE->>API: POST /projects
    API->>DB: Insert project
    API-->>FE: project_id
    FE->>FE: Navigate /projects/{id}/designer
    U->>FE: Drag nodes onto canvas
    FE->>FE: Update local graph state (Zustand)
    U->>FE: Save
    FE->>API: PUT /pipelines/{id}/graph
    API->>DB: Save graph_definition (JSONB)
    API-->>FE: OK
```

---

## 3. Knowledge Base Ingestion

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Ingestion API
    participant Q as Redis Queue
    participant W as Worker
    participant S3 as Object Storage
    participant V as Vector DB

    U->>FE: Upload PDFs (Knowledge Base tab)
    FE->>API: POST /knowledge/upload (multipart)
    API->>S3: Store raw files
    API->>DB: Create document records (status=pending)
    API->>Q: Enqueue ingest job
    API-->>FE: job_id

    W->>Q: Dequeue job
    W->>S3: Fetch document
    W->>W: Parse → Chunk → Embed
    W->>V: Upsert vectors
    W->>DB: Update status=indexed
    W-->>FE: WebSocket progress (optional)

    U->>FE: View indexed doc count
    FE->>API: GET /knowledge/documents
    API-->>FE: Document list + statuses
```

---

## 4. Playground Query (Single Pipeline)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Playground
    participant API as RAG Runtime
    participant V as Vector DB
    participant LLM as LLM Provider

    U->>FE: Type question + Send
    FE->>API: POST /playground/query
    Note over API: Load pipeline version + graph
    API->>API: Execute: Memory → Retrieve → Prompt → LLM
    API->>V: Similarity search
    V-->>API: Top-k chunks
    API->>LLM: Completion with context
    LLM-->>API: Answer
    API-->>FE: answer + sources + trace
    FE-->>U: Render response + citations
```

---

## 5. A/B Playground Compare

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Playground
    participant API as Playground API
    participant RAG as RAG Runtime

    U->>FE: Select Variant A & B configs
    U->>FE: Enter shared query
    FE->>API: POST /playground/compare
    par Variant A
        API->>RAG: Run pipeline A
        RAG-->>API: Response A + metrics
    and Variant B
        API->>RAG: Run pipeline B
        RAG-->>API: Response B + metrics
    end
    API->>DB: Log eval_run row
    API-->>FE: { a, b, latency_diff, ... }
    FE-->>U: Side-by-side UI
    U->>FE: Vote "A better"
    FE->>API: POST /playground/vote
```

---

## 6. Designer ↔ Config Tab Sync

```mermaid
flowchart LR
    subgraph Canvas["Designer Canvas"]
        N1[Chunker Node]
        N2[Embedder Node]
        N3[Vector Store Node]
        N1 --> N2 --> N3
    end

    subgraph Tabs["Config Tabs"]
        T1[Knowledge Base]
        T2[Embeddings]
        T3[Vector Store]
    end

    N1 -.->|selected| T1
    N2 -.->|selected| T2
    N3 -.->|selected| T3

    T1 -->|update node.data| N1
    T2 -->|update node.data| N2
    T3 -->|update node.data| N3
```

**Rule**: Each node type maps to a tab panel. `node.data.config` is the single source of truth; tabs read/write that object.

---

## 7. Evaluation Batch Run

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Eval UI
    participant API as Eval API
    participant W as Worker
    participant RAG as RAG Runtime

    U->>FE: Upload CSV (question, expected_answer)
    FE->>API: POST /eval/datasets
    U->>FE: Run eval on pipeline v3
    FE->>API: POST /eval/runs
    API->>W: Batch job (N questions)
    loop Each row
        W->>RAG: Query pipeline
        W->>W: Score (LLM-as-judge or metrics)
    end
    W->>DB: Store aggregate metrics
    FE->>API: GET /eval/runs/{id}
    API-->>FE: Report (accuracy, latency p95, etc.)
```

---

## 8. Page Routes (Frontend)

| Route | Page | Auth |
|-------|------|------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/home` | Dashboard | Protected |
| `/projects` | Project list | Protected |
| `/projects/[id]` | Project overview | Protected |
| `/projects/[id]/designer` | Visual RAG designer | Protected |
| `/projects/[id]/knowledge` | Knowledge base tab | Protected |
| `/projects/[id]/memory` | Memory config | Protected |
| `/projects/[id]/retrieval` | Retrieval config | Protected |
| `/projects/[id]/generation` | LLM & prompts | Protected |
| `/projects/[id]/playground` | Playground + A/B | Protected |
| `/projects/[id]/evaluation` | Batch eval | Protected |
| `/settings` | User & org settings | Protected |

Designer can be the default tab with sub-routes or a tab layout wrapping all RAG steps.
