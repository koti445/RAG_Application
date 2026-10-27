# Backend — FastAPI RAG Platform API

## Structure

```
app/
├── main.py                       # FastAPI app entry
├── core/
│   ├── config.py                 # Settings (pydantic-settings)
│   ├── security.py               # JWT, password hashing
│   └── dependencies.py           # DI: get_db, get_current_user
├── api/
│   └── v1/
│       ├── router.py             # Aggregate routers
│       └── endpoints/
│           ├── auth.py
│           ├── projects.py
│           ├── pipelines.py
│           ├── knowledge.py
│           ├── playground.py
│           ├── evaluation.py
│           └── memory.py
├── models/                       # SQLAlchemy ORM models
│   ├── user.py
│   ├── project.py
│   ├── pipeline.py
│   └── document.py
├── schemas/                      # Pydantic request/response
│   ├── auth.py
│   ├── project.py
│   ├── pipeline.py
│   └── playground.py
├── services/                     # Business logic
│   ├── auth_service.py
│   ├── project_service.py
│   ├── ingestion_service.py
│   └── playground_service.py
├── rag_engine/                   # Pipeline execution
│   ├── executor.py               # Topological graph runner
│   ├── nodes/                    # Node executors (registry)
│   │   ├── retriever.py
│   │   ├── embedder.py
│   │   ├── llm.py
│   │   └── memory.py
│   └── tracing.py
├── integrations/
│   ├── vector_store/             # Qdrant client
│   ├── storage/                  # S3/MinIO
│   └── llm/                      # OpenAI, Azure OpenAI
├── workers/
│   ├── celery_app.py
│   └── tasks/
│       └── ingestion.py
└── db/
    ├── session.py
    └── base.py
alembic/                          # DB migrations
tests/
requirements.txt
```

## Initialize

```bash
python -m venv .venv
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
