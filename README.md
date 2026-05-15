# Vogal

Vogal is a pnpm/Turborepo monorepo for a document intelligence system. The backend ingests PDFs, stores file references, extracts text, creates embeddings, indexes chunks in Qdrant, and exposes search/chat APIs over HTTP and tRPC. The frontend is a React/Vite console for health checks, users, workspaces, documents, uploads, and search.

## Repository Layout

```text
apps/backend/    Fastify + tRPC API, Drizzle/Postgres, Qdrant, Redis, storage, AI adapters
apps/frontend/   React 19 + Vite + Tailwind UI backed by the backend tRPC router
.codex/          Codex skills, prompts, and Ralph Loop reviewer subagents
.claude/         Claude Code commands, samples, settings, and mirrored reviewer agents
docs/            Shared workflow and project documentation
```

## Requirements

- Devbox with Node.js 24.x from `devbox.json`
- pnpm 11.1.2 via Corepack
- Docker Desktop or compatible Docker daemon
- OpenAI API key for embedding, normalization, and chat flows

Enter the project environment with:

```bash
devbox shell
pnpm install
```

## Local Infrastructure

The backend compose stack lives at `apps/backend/docker-compose.yml` and uses `apps/backend/.env` for image names, ports, credentials, and service tokens.

```bash
docker compose --env-file apps/backend/.env -f apps/backend/docker-compose.yml up -d
```

Default local services from the current compose env are:

```text
Postgres   localhost:15432
Redis      localhost:16379
Qdrant     localhost:16333
Localstack localhost:4566
```

Apply database migrations from the backend package after Postgres is available:

```bash
pnpm --filter @c3-oss/vogal-backend db:migrate
```

## Run The Apps

```bash
pnpm --filter @c3-oss/vogal-backend start
pnpm --filter @c3-oss/vogal-frontend start
```

The frontend defaults to `http://localhost:5173` and calls `http://localhost:3000/trpc`.

## Common Commands

```bash
pnpm --filter @c3-oss/vogal-backend typecheck
pnpm --filter @c3-oss/vogal-frontend typecheck
pnpm --filter @c3-oss/vogal-backend lint
pnpm --filter @c3-oss/vogal-frontend lint
pnpm --filter @c3-oss/vogal-backend test
pnpm turbo run build
```

Use `just --list` for repo-local aliases.

## Agent Workflow Assets

This repo includes Ralph Loop workflow assets from `c3-oss/ralph-loop-governor`:

- `.codex/skills/ralph-loop-governor/` for governed implementation runs
- `.codex/skills/repo-commit-and-push/` for commit/push policy
- `.codex/skills/parallel-delegation/` for safe subagent decomposition
- `.codex/skills/sync-claude-md/` for Claude guidance alignment
- `.codex/agents/` and `.claude/agents/` for reviewer specialists
- `.codex/prompts/` for kickoff, restart, slicing, and final review prompts

See `docs/ralph-loop-governor.md` for the full operating model.

## Notes

- Keep secrets out of git. `.env` files are ignored.
- Generated Docker volumes under `apps/backend/.volumes/` are ignored.
- Biome remains on v1 because `@c3-oss/config-biome@0.3.1` currently peers against `@biomejs/biome ^1.9.4`.
