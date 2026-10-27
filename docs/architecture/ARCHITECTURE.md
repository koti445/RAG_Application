# RAG Platform — Enterprise Architecture

## 1. Vision

A full-stack platform where users **design**, **configure**, **deploy**, and **evaluate** RAG pipelines through a visual workflow builder (draw.io-style) and tabbed configuration UI, with a playground for A/B testing and validation.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ ┌──────────────────────────┐ │
│  │  Auth    │ │   Home   │ │  RAG Designer   │ │  Playground / Eval       │ │
│  │  Login   │ │ Dashboard│ │  (React Flow)   │ │  A/B · Metrics · Traces  │ │
│  └────┬─────┘ └────┬─────┘ └────────┬────────┘ └────────────┬─────────────┘ │
└───────┼────────────┼────────────────┼─────────────────────────┼───────────────┘
        │            │                │                         │
        ▼            ▼                ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / BFF (Next.js API Routes)               │
│                    Auth middleware · Rate limit · Request routing            │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES (FastAPI)                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │   Auth     │ │  Projects  │ │  Pipeline  │ │ Ingestion  │ │  Eval     │ │
│  │  Service   │ │  Service   │ │  Service   │ │  Worker    │ │  Service  │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                               │
│  │  RAG       │ │  Memory    │ │  Playground│                               │
│  │  Runtime   │ │  Service   │ │  Service   │                               │
│  └────────────┘ └────────────┘ └────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  PostgreSQL (users, projects, pipelines, eval runs)                          │
│  Redis (sessions, job queue, cache)                                          │
│  Vector DB — Qdrant / pgvector (embeddings, chunks)                          │
│  Object Storage — MinIO/S3 (raw documents, exports)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. User Journey & Workflow

### 3.1 Authentication → Home

```
Login → JWT/Session → Home Dashboard
                          ├── Recent projects
                          ├── Quick actions (New RAG, Open Designer)
                          └── Usage / eval summary
```

### 3.2 RAG Project Lifecycle

```
1. CREATE PROJECT
   └── Name, description, team/workspace

2. DESIGN (Visual Designer Tab)
   └── Drag-and-drop nodes on canvas (React Flow)
       ├── Data Source (files, URLs, DB, API)
       ├── Chunking
       ├── Embedding
       ├── Vector Store
       ├── Retriever (semantic, hybrid, reranker)
       ├── Memory (conversation, long-term)
       ├── LLM / Prompt Template
       ├── Guardrails / Filters
       └── Output

3. CONFIGURE (Tabbed panels — sync with canvas nodes)
   ├── Knowledge Base   — upload docs, chunk strategy, metadata
   ├── Embeddings     — model, dimensions, batch size
   ├── Vector Store   — collection, index params
   ├── Retrieval      — top-k, filters, reranking
   ├── Memory         — short-term (buffer), long-term (summary/store)
   ├── Generation     — LLM, temperature, system prompt
   ├── Guardrails     — PII, topic filters
   └── Advanced       — caching, fallbacks

4. INGEST & INDEX
   └── Async worker processes documents → chunks → embeddings → vector DB

5. PLAYGROUND
   └── Chat UI against live pipeline
   └── Side-by-side A/B (variant A vs B configs)
   └── Metrics: latency, token usage, retrieval scores
   └── Export traces for debugging

6. EVALUATE
   └── Upload golden Q&A dataset
   └── Run batch eval (faithfulness, relevance, answer correctness)
   └── Compare runs / versions

7. DEPLOY (optional phase)
   └── API endpoint per pipeline version
```

### 3.3 Visual Designer (draw.io-style)

| Concept | Implementation |
|---------|----------------|
| Canvas | **React Flow** — nodes, edges, zoom, pan, minimap |
| Node types | Custom nodes per RAG step (registry pattern) |
| Persistence | Graph JSON stored in `pipeline_versions.graph_definition` |
| Validation | DAG check, required nodes, edge compatibility |
| Sync | Selecting a node opens the matching config tab |

**Node categories:**

- **Input**: Document Loader, Web Scraper, Database Connector
- **Transform**: Text Splitter, Metadata Enricher, Cleaner
- **Index**: Embedder, Vector Store Writer
- **Retrieve**: Semantic Search, Hybrid Search, Reranker
- **Memory**: Conversation Buffer, Summary Memory, Entity Memory
- **Generate**: Prompt Template, LLM, Chain
- **Output**: Response Formatter, API Output
- **Utility**: Conditional, Merge, Cache

---

## 4. RAG Pipeline Tabs (Feature Map)

| Tab | Purpose | Key settings |
|-----|---------|--------------|
| **Designer** | Visual graph editor | Nodes, edges, layout |
| **Knowledge Base** | Document management | Upload, parsers, chunk size/overlap |
| **Embeddings** | Vectorization | Model provider, API keys (vault) |
| **Vector Store** | Index config | Collection name, distance metric |
| **Retrieval** | Search strategy | top_k, MMR, filters, reranker |
| **Memory** | Context persistence | Window size, summarization |
| **Generation** | LLM & prompts | Model, system/user templates |
| **Guardrails** | Safety & quality | Blocklists, max tokens |
| **Playground** | Interactive test | Chat, A/B variants |
| **Evaluation** | Batch metrics | Datasets, scorers, reports |
| **Settings** | Project meta | Name, env vars, API keys |
| **Versions** | History | Diff, rollback, tags |

---

## 5. A/B Testing in Playground

```
┌─────────────────────────────────────────────────────────┐
│  Playground                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Variant A          │  │  Variant B          │       │
│  │  (retriever: hybrid)│  │  (retriever: semantic)│     │
│  │  ─────────────────  │  │  ─────────────────  │       │
│  │  User: "..."        │  │  User: "..."        │       │
│  │  Bot: "..."         │  │  Bot: "..."         │       │
│  └─────────────────────┘  └─────────────────────┘       │
│  Shared query input · Compare latency · Vote winner      │
└─────────────────────────────────────────────────────────┘
```

**Backend**: `POST /api/v1/playground/compare` runs both pipeline configs in parallel, returns answers + retrieval traces + timings.

**Storage**: `eval_runs` table stores variant configs, queries, responses, user votes.

---

## 6. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript | SSR, API routes as BFF, enterprise standard |
| **UI** | Tailwind CSS, shadcn/ui | Accessible, consistent components |
| **Designer** | React Flow (`@xyflow/react`) | Production-grade node editor |
| **State** | Zustand + React Query | Canvas state + server cache |
| **Backend** | FastAPI (Python) | RAG/ML ecosystem (LangChain, LlamaIndex) |
| **Auth** | JWT + refresh tokens (or Auth.js on frontend) | Stateless API, SSO-ready |
| **Primary DB** | PostgreSQL 16 | ACID, JSONB for graph configs |
| **Vector DB** | Qdrant (or pgvector) | Scale, filtering, hybrid search |
| **Cache/Queue** | Redis + Celery (or ARQ) | Async ingestion, job status |
| **Object Storage** | MinIO (dev) / S3 (prod) | Raw documents |
| **Observability** | OpenTelemetry, structured logs | Traces per RAG step |
| **IaC** | Docker Compose (dev), Terraform (prod) | Reproducible environments |

---

## 7. Security & Multi-Tenancy

- **Workspace / Organization** → **Projects** → **Pipeline versions**
- Row-level security by `organization_id`
- API keys stored encrypted (vault or DB encryption at rest)
- RBAC: `owner`, `editor`, `viewer`
- Audit log for config changes and eval runs

---

## 8. API Design (REST + WebSocket)

```
/auth          POST /login, /register, /refresh
/projects      CRUD
/pipelines     CRUD + versions
/pipelines/:id/graph     GET/PUT graph JSON
/knowledge     upload, list documents, ingest status
/playground    POST /query, POST /compare (A/B)
/eval          POST /runs, GET /results
/memory        GET/DELETE conversation sessions
```

WebSocket: `/ws/ingest/{job_id}` for real-time ingestion progress.

---

## 9. RAG Runtime Execution

When a playground query runs:

```
User Query
    → Load pipeline graph (topological sort)
    → Execute nodes in order:
        1. Memory: load conversation history
        2. Retriever: embed query → vector search → optional rerank
        3. Prompt: assemble context + query
        4. LLM: generate response
        5. Memory: persist turn
    → Return response + sources + trace (per-node timings)
```

Graph execution engine lives in `backend/app/rag_engine/` — pluggable node executors.

---

## 10. Deployment Topology (Production)

```
                    ┌─────────────┐
                    │   CDN/WAF   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │   Frontend (Vercel/K8s) │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │   API (K8s / ECS)       │
              └────────────┬────────────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   PostgreSQL          Redis/Qdrant      Workers (Celery)
```

---

## 11. Phased Implementation Roadmap

| Phase | Deliverable |
|-------|-------------|
| **P0** | Auth, home, project CRUD, folder scaffold |
| **P1** | Designer canvas + graph persistence |
| **P1** | Knowledge base upload + ingestion worker |
| **P2** | Tabbed config panels synced to nodes |
| **P2** | Basic playground (single variant) |
| **P3** | A/B playground + eval datasets |
| **P4** | Versioning, deploy API, observability |

See [WORKFLOW.md](./WORKFLOW.md) for sequence diagrams and [DATABASE.md](../database/DATABASE.md) for schema.
