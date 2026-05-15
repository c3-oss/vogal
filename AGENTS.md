# Repository Guidelines

## Project Shape
Vogal is a pnpm workspace with two main apps:

- `apps/backend`: Fastify + tRPC API using hexagonal architecture. Runtime code is under `src`, Drizzle models/migrations live under `src/adapter/out/db`, DBML references live in `dbml`, and long-form backend docs live in `handbook`.
- `apps/frontend`: React + Vite client. UI primitives are under `src/components`, route pages under `src/pages`, API helpers under `src/utils`, and styles beside their consumers.

Generated output belongs in each app's `dist` directory. Keep uploaded files and large artifacts out of commits.

## Toolchain

- Use Devbox for the expected local runtime: `devbox shell`.
- Node is pinned through Devbox as `nodejs@24`; repository engines require Node `>=24`.
- pnpm is managed through `packageManager` and Corepack. Use the checked-in lockfile, not npm or yarn.
- Biome remains pinned to the `@c3-oss/config-biome` peer range. Do not upgrade it independently unless the shared config supports the newer major.

## Common Commands

- `pnpm install` - install workspace dependencies.
- `pnpm --filter @c3-oss/vogal-backend start` - start the API in watch mode.
- `pnpm --filter @c3-oss/vogal-frontend start` - start the Vite frontend.
- `pnpm turbo run build` - type-check and bundle the workspace graph.
- `pnpm --filter @c3-oss/vogal-backend test` - run backend unit tests.
- `pnpm --filter @c3-oss/vogal-backend test:e2e` - run backend E2E tests with PGLite.
- `pnpm --filter @c3-oss/vogal-backend db:migrate` - apply Drizzle migrations with env vars loaded.

## Coding Style

All TypeScript is linted and formatted with Biome via `@c3-oss/config-biome`:

- 2-space indentation.
- Single quotes.
- Sorted imports.
- PascalCase for classes and React component files.
- camelCase for functions and variables.
- Preserve backend `~` path aliases from `tsconfig.json`.

Run package-local lint commands before submitting code. Use `lint:fix` for straightforward formatting/import fixes and review unsafe rewrites manually.

## Architecture Expectations

The backend follows ports-and-adapters boundaries:

- `core/application/usecase`: business workflows.
- `core/application/port`: interface contracts.
- `adapter/in`: HTTP and tRPC entrypoints.
- `adapter/out`: database, vector DB, AI, storage, cache, and background processing implementations.
- `infra`: config, errors, and infrastructure helpers.

Use dependency injection through `WiringContext`. Keep use cases independent from concrete adapters. Domain failures should use the `VError` hierarchy and `Failable<T>` / `Option<Error>` patterns already present in the codebase.

## Testing Guidance

Vitest powers unit and integration coverage. Prefer specs beside implementations in `__tests__` folders. E2E tests should use the existing PGLite path instead of requiring an external Postgres when possible. Add fixtures under `apps/backend/test` when mocking external services.

## Agent Assets

This repository includes agent workflow assets imported from Ralph Loop Governor:

- `.codex/skills`: Codex skills for planning, execution loops, review, sync, and validation workflows.
- `.codex/agents`: Codex subagent definitions.
- `.codex/prompts`: reusable prompt templates.
- `.claude/agents`: Claude-compatible agent definitions.
- `docs/ralph-loop-governor.md`: overview and operational notes for the Ralph loop workflow.

When editing agent instructions, keep `AGENTS.md`, `CLAUDE.md`, `.codex/skills`, and `.claude/agents` aligned. Prefer updating the source instruction file and syncing rather than hand-maintaining divergent copies.

## Commit and PR Guidelines

Commits follow Conventional Commits with scoped messages, for example `feat(backend): add document search filter` or `chore(workspace): update dependencies`. Use scopes that map to workspace folders where practical. PRs should describe user-facing impact, schema/env changes, linked issues, validation output, and screenshots for UI changes.

## Environment and Safety Notes

Copy sample env files before starting services and never commit secrets. Docker compose files under `apps/backend` provision local infrastructure for full-stack testing. Review diffs before committing generated files, lockfile changes, uploads, PDFs, or dependency updates.
