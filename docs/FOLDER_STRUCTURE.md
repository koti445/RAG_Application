# Enterprise Folder Structure Reference

Complete monorepo layout for the RAG Platform.

```
RAG_Application/
│
├── apps/                                    # Deployable applications
│   ├── frontend/                            # Next.js 14 (App Router)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/                  # Route group: no sidebar
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   └── register/page.tsx
│   │   │   │   ├── (dashboard)/             # Route group: authenticated shell
│   │   │   │   │   ├── layout.tsx           # Sidebar + auth guard
│   │   │   │   │   ├── home/page.tsx
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [projectId]/
│   │   │   │   │   │       ├── layout.tsx   # RAG step tabs
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       ├── designer/page.tsx
│   │   │   │   │   │       ├── knowledge/page.tsx
│   │   │   │   │   │       ├── embeddings/page.tsx
│   │   │   │   │   │       ├── retrieval/page.tsx
│   │   │   │   │   │       ├── memory/page.tsx
│   │   │   │   │   │       ├── generation/page.tsx
│   │   │   │   │   │       ├── playground/page.tsx
│   │   │   │   │   │       └── evaluation/page.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── api/                     # Optional BFF routes
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                      # shadcn primitives
│   │   │   │   ├── layout/
│   │   │   │   ├── designer/
│   │   │   │   │   ├── RagDesigner.tsx
│   │   │   │   │   ├── NodePalette.tsx
│   │   │   │   │   ├── DesignerToolbar.tsx
│   │   │   │   │   └── nodes/               # Custom React Flow nodes
│   │   │   │   ├── rag-tabs/
│   │   │   │   ├── playground/
│   │   │   │   └── evaluation/
│   │   │   ├── features/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── backend/                             # FastAPI Python API
│       ├── app/
│       │   ├── main.py
│       │   ├── core/
│       │   ├── api/v1/endpoints/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   ├── rag_engine/
│       │   ├── integrations/
│       │   ├── workers/
│       │   └── db/
│       ├── alembic/
│       ├── tests/
│       └── requirements.txt
│
├── packages/                                # Shared libraries
│   └── shared-types/                        # TS types / API contracts
│
├── database/
│   ├── migrations/                          # SQL / Alembic migrations
│   └── seeds/                               # Dev seed scripts
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   └── Dockerfile.worker
│   └── terraform/                           # Optional cloud IaC
│       ├── modules/
│       └── environments/
│           ├── dev/
│           └── prod/
│
├── docs/
│   ├── architecture/
│   ├── database/
│   └── api/                                 # OpenAPI exports
│
├── scripts/
│   ├── setup-dev.sh
│   └── seed-db.sh
│
├── .github/
│   └── workflows/                           # CI/CD
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **apps/frontend** | UI, routing, designer canvas, forms, playground |
| **apps/backend** | REST API, auth, RAG execution, job orchestration |
| **packages/** | Shared types, optional shared utils |
| **database/** | Schema source of truth, migrations, seeds |
| **infrastructure/** | Containers, cloud resources |
| **docs/** | Architecture, ADRs, API docs |
| **scripts/** | One-off automation, not app code |

## Naming Conventions

- **API routes**: kebab-case URLs (`/api/v1/playground/compare`)
- **Python modules**: snake_case
- **React components**: PascalCase
- **DB tables**: snake_case plural (`pipeline_versions`)
- **Env vars**: SCREAMING_SNAKE_CASE
