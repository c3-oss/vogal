# Vogal

Vogal is a workspace-aware document intelligence platform for teams that store PDFs and need fast semantic retrieval. It combines document ingestion, vector indexing, and conversational search in a single monorepo with a Fastify/tRPC API and a React/Vite console.

## What is Vogal

- **Ingestion**: upload documents, extract text, and normalize content into searchable chunks.
- **Indexing**: generate embeddings and persist chunk vectors in Qdrant.
- **Retrieval**: search and chat over indexed documents with workspace boundaries.
- **Orchestration**: optional AI planning and tool-calling surfaces for chat workflows.

## Architecture

```text
apps/backend/    Fastify + tRPC API (Drizzle/Postgres, Qdrant, Redis, storage, OpenAI adapters)
apps/frontend/   React 19 + Vite + Tailwind UI consumed from backend tRPC contracts
packages/        Shared helpers and reusable components
docs/            Operational documentation and project handbooks
.codex/          Codex agent workflows and Ralph Loop governance assets
.claude/         Claude command and reviewer assets
```

## Requirements

- Node.js 24.x (via Devbox / `devbox.json`)
- pnpm 11.x (via Corepack)
- Docker-compatible runtime for local services
- OpenAI API key for embeddings, text processing, and chat

## Quickstart

```bash
git clone https://github.com/c3-oss/vogal.git
cd vogal
devbox shell
pnpm install

docker compose --env-file apps/backend/.env -f apps/backend/docker-compose.yml up -d
pnpm --filter @c3-oss/vogal-backend db:migrate
pnpm --filter @c3-oss/vogal-backend start
pnpm --filter @c3-oss/vogal-frontend start
```

After both services are running:

- Backend API: `http://localhost:3000`
- Frontend UI: `http://localhost:5173`
- Health endpoint: `http://localhost:3000/health`

## Local Infrastructure

The backend stack is defined in `apps/backend/docker-compose.yml` and configured through `apps/backend/.env`.

```text
Postgres   localhost:15432
Redis      localhost:16379
Qdrant     localhost:16333
MiniStack  localhost:4566
```

## Development Commands

```bash
pnpm --filter @c3-oss/vogal-backend start
pnpm --filter @c3-oss/vogal-frontend start

pnpm --filter @c3-oss/vogal-backend typecheck
pnpm --filter @c3-oss/vogal-frontend typecheck

pnpm --filter @c3-oss/vogal-backend lint
pnpm --filter @c3-oss/vogal-frontend lint

pnpm --filter @c3-oss/vogal-backend test
pnpm --filter @c3-oss/vogal-backend test:e2e
pnpm turbo run build
```

Use `just --list` for repo-local aliases and workflow shorthands.

## Docs

Backend-specific references live in `apps/backend/README.md` and the handbook:

- `apps/backend/handbook/architecture.md`
- `apps/backend/handbook/features.md`
- `apps/backend/handbook/getting-started.md`
- `apps/backend/handbook/api-reference.md`
- `docs/ralph-loop-governor.md`

## Agent Workflow Layer

This repository ships with governance and execution assets under `.codex/` and `.claude/`:

- governed implementation loops
- reviewer agents
- reusable prompts and commit/push helpers

## Operational Notes

- Keep secrets in local `.env` files only (already ignored).
- Generated runtime artifacts (including `apps/backend/.volumes/`) should stay out of git.
- Biome is pinned by shared config and currently remains on v1-compatible alignment.

## License

To the extent possible under law, [Caian Ertl][me] has waived __all copyright
and related or neighboring rights to this work__. In the spirit of _freedom of
information_, I encourage you to fork, modify, change, share, or do whatever
you like with this project! [`^C ^V`][kopimi]

[![License][cc-shield]][cc-url]

[me]: https://github.com/upsetbit
[cc-shield]: https://forthebadge.com/images/badges/cc-0.svg
[cc-url]: http://creativecommons.org/publicdomain/zero/1.0
[kopimi]: https://kopimi.com
