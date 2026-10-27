# Frontend — Next.js RAG Platform UI

## Structure

```
src/
├── app/                          # App Router pages
│   ├── (auth)/                   # Public auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected routes (layout with sidebar)
│   │   ├── home/
│   │   ├── projects/
│   │   │   └── [projectId]/
│   │   │       ├── layout.tsx    # Tab navigation for RAG steps
│   │   │       ├── page.tsx      # Overview
│   │   │       ├── designer/     # React Flow canvas
│   │   │       ├── knowledge/
│   │   │       ├── embeddings/
│   │   │       ├── retrieval/
│   │   │       ├── memory/
│   │   │       ├── generation/
│   │   │       ├── playground/
│   │   │       └── evaluation/
│   │   └── settings/
│   ├── api/                      # BFF routes (optional proxy)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── auth/
│   ├── layout/                   # Sidebar, header, nav
│   ├── designer/                 # React Flow nodes, toolbar, palette
│   ├── rag-tabs/                 # Per-tab config panels
│   ├── playground/               # Chat, A/B split view
│   └── evaluation/               # Dataset upload, results charts
├── features/                     # Feature modules (hooks + API)
│   ├── auth/
│   ├── projects/
│   ├── pipeline/
│   ├── knowledge/
│   ├── playground/
│   └── evaluation/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   └── utils.ts
├── stores/
│   └── designer-store.ts       # Zustand: canvas graph state
└── types/
    └── index.ts
```

## Key packages

- `next`, `react`, `typescript`
- `@xyflow/react` — visual designer
- `@tanstack/react-query` — server state
- `zustand` — designer canvas state
- `tailwindcss`, `shadcn/ui`
- `next-auth` or custom JWT client

## Initialize

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npx shadcn@latest init
npm install @xyflow/react zustand @tanstack/react-query axios
```
