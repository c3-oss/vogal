# CLAUDE.md

Read `AGENTS.md` first. This file adds Claude-specific working notes for the Vogal repository.

## Runtime

Use the repository Devbox environment when possible:

```bash
devbox shell
pnpm install
```

The workspace expects Node `>=24` and pnpm via Corepack/packageManager. Avoid npm or yarn in this repository.

## Common Commands

```bash
# Install all workspace dependencies
pnpm install

# Build all workspaces through Turbo
pnpm build
pnpm turbo run build

# Backend
pnpm --filter @c3-oss/vogal-backend start
pnpm --filter @c3-oss/vogal-backend typecheck
pnpm --filter @c3-oss/vogal-backend lint
pnpm --filter @c3-oss/vogal-backend test
pnpm --filter @c3-oss/vogal-backend test:e2e
pnpm --filter @c3-oss/vogal-backend db:generate
pnpm --filter @c3-oss/vogal-backend db:migrate

# Frontend
pnpm --filter @c3-oss/vogal-frontend start
pnpm --filter @c3-oss/vogal-frontend typecheck
pnpm --filter @c3-oss/vogal-frontend lint
```

## Claude and Agent Workflows

Ralph Loop Governor assets are present in this repo:

- `.claude/agents`: Claude subagents.
- `.claude/commands`: Claude command prompts already maintained by the project.
- `.codex/agents`: Codex subagents.
- `.codex/skills`: Codex workflow skills.
- `.codex/prompts`: reusable prompt templates.
- `docs/ralph-loop-governor.md`: imported Ralph workflow documentation.

When updating workflow instructions, keep Claude and Codex assets semantically aligned. Do not duplicate a Codex skill into a Claude-only location unless the target tool needs a different file format.

## Architecture

The backend implements hexagonal architecture under `apps/backend/src`:

```text
core/
  application/
    usecase/        # Business workflows
    port/           # Interface contracts
    dto/            # Data transfer objects
adapter/
  in/               # HTTP and tRPC input adapters
  out/              # DB, vector DB, AI, storage, cache, background adapters
infra/
  config/           # Environment and configuration
  errors/           # VError hierarchy
  pdf/              # PDF parsing utilities
```

Important conventions:

- `WiringContext` composes concrete adapters and use cases.
- Use cases extend the existing base patterns and define typed dependency contracts.
- Ports stay in the core layer; adapters implement those ports.
- External failures should be wrapped in domain errors or `Failable<T>` results.
- Background document processing follows the existing saga/event strategy.

## Domain Model

Core entities include:

- `Workspace`: multi-tenant container.
- `User`: workspace user account.
- `Document`: uploaded file.
- `DocumentPage`: parsed document page.
- `DocumentMetadata`: extracted metadata.
- `DocumentUpload`: upload state machine from pending through finalized.
- `VectorPoints`: semantic-search embeddings in Qdrant.

## Document Processing Flow

1. PDF upload enters through HTTP or tRPC.
2. Storage adapter writes the file to S3/Firebase-compatible storage.
3. PDF parser extracts pages and text.
4. AI adapter normalizes content and generates embeddings.
5. Qdrant adapter indexes vectors.
6. Background processing coordinates long-running steps outside request/response flow.

## Dependency Notes

The project depends on C3 OSS packages for functional results, logging, type guards, Drizzle ULIDs, and shared configs. Keep shared config peer ranges in mind before major upgrades, especially Biome.

## Working Rules

- Prefer package-scoped commands with `pnpm --filter`.
- Keep generated artifacts out of review unless they are the intended output.
- For schema work, update Drizzle models and generate migrations intentionally.
- For UI work, include screenshots or describe visual changes in PR notes.
- For dependency updates, run install under the Devbox Node version so native packages are built for the expected runtime.
