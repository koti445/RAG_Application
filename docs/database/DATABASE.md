# Database Schema Overview

## Entity Relationship (Core)

```
organizations ──┬── users (membership)
                └── projects ──┬── pipeline_versions
                               ├── documents
                               ├── conversations
                               └── eval_runs
```

## Key Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt |
| full_name | VARCHAR | |
| created_at | TIMESTAMPTZ | |

### `organizations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | |
| slug | VARCHAR UNIQUE | |

### `organization_members`
| user_id | UUID FK | |
| organization_id | UUID FK | |
| role | ENUM | owner, editor, viewer |

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| organization_id | UUID FK | |
| name | VARCHAR | |
| description | TEXT | |
| created_by | UUID FK users | |

### `pipeline_versions`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| version | INT | Incremental |
| graph_definition | JSONB | React Flow graph |
| config_snapshot | JSONB | Merged tab configs |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| filename | VARCHAR | |
| storage_path | VARCHAR | S3/MinIO key |
| status | ENUM | pending, processing, indexed, failed |
| chunk_count | INT | |
| metadata | JSONB | |

### `conversations` / `messages`
Session-based memory for playground; `messages` stores role, content, token_count.

### `eval_runs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| run_type | ENUM | ab_compare, batch_eval |
| variant_a_config | JSONB | |
| variant_b_config | JSONB | nullable |
| results | JSONB | metrics, traces |
| created_by | UUID FK | |

## Vector Store (Qdrant)

- Collection per project: `project_{project_id}`
- Payload: `document_id`, `chunk_index`, `text`, `metadata`

## Migrations

SQL migrations live in `database/migrations/`. Use Alembic (backend) or raw SQL for PostgreSQL.

Initial migration: `database/migrations/001_initial_schema.sql`
