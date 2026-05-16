# @c3-oss/vogal-backend

Fastify/tRPC backend for Vogal, a Retrieval-Augmented Generation system for PDF documents. It manages users, workspaces, uploads, document processing, vector search, and chat over indexed knowledge.

## Architecture

The backend follows a ports-and-adapters structure:

```text
src/core/application/    DTOs, ports, and use cases
src/adapter/in/         HTTP, tRPC, controllers, validators, wiring
src/adapter/out/        Postgres/Drizzle, Qdrant, Redis, storage, OpenAI, tools
src/infra/              config, errors, PDF parsing, text utilities, circuit breakers
```

Primary runtime dependencies:

- Postgres via Drizzle ORM
- Qdrant for vector collections per workspace
- Redis for optional cache wrappers
- S3-compatible storage or Firebase Storage
- OpenAI for embeddings, normalization, planning, and chat completion

## Local Setup

From the repository root:

```bash
docker compose --env-file apps/backend/.env -f apps/backend/docker-compose.yml up -d
pnpm --filter @c3-oss/vogal-backend db:migrate
pnpm --filter @c3-oss/vogal-backend start
```

The compose stack provides Postgres, Redis Stack, Qdrant, and MiniStack. Keep local `.env` values aligned with `src/infra/config/env.ts`; storage variables use the `VOGAL_STORAGE_*` prefix.

## Scripts

```bash
pnpm --filter @c3-oss/vogal-backend start
pnpm --filter @c3-oss/vogal-backend typecheck
pnpm --filter @c3-oss/vogal-backend lint
pnpm --filter @c3-oss/vogal-backend lint:fix
pnpm --filter @c3-oss/vogal-backend test
pnpm --filter @c3-oss/vogal-backend test:e2e
pnpm --filter @c3-oss/vogal-backend db:generate
pnpm --filter @c3-oss/vogal-backend db:migrate
```

## Public Surfaces

HTTP routes include health, upload, search, documents, users, workspaces, and chat messages. The tRPC router exposes the same application surface for the React frontend.

Current feature areas:

- PDF upload and ingestion saga
- Workspace-scoped vector indexing
- Semantic search with Qdrant
- Chat sessions and message persistence
- Knowledge-search tool integration for chat planning

## Documentation

Detailed backend references live in `handbook/`:

| Section | File |
|---|---|
| Architecture and Tech Stack | [architecture.md](handbook/architecture.md) |
| Features | [features.md](handbook/features.md) |
| Getting Started | [getting-started.md](handbook/getting-started.md) |
| API Reference | [api-reference.md](handbook/api-reference.md) |
| Development | [development.md](handbook/development.md) |
| Deployment | [deployment.md](handbook/deployment.md) |
| Contributing | [contributing.md](handbook/contributing.md) |
| SAGA Implementation for Ingestion Pipeline | [saga-implementation.md](handbook/saga-implementation.md) |
| HTTP Stack Verification Runbook | [verification-http.md](handbook/verification-http.md) |
| TRPC Stack Verification Runbook | [verification-trpc.md](handbook/verification-trpc.md) |
