# Repository Guidelines

## Project Structure & Module Organization
Vogal is a pnpm workspace with encapsulated apps. The Fastify backend lives in `apps/backend/src`, split into `adapter`, `core`, and `infra` layers; database models stay in `apps/backend/dbml`, and long-form references in `apps/backend/handbook`. The React client sits in `apps/frontend/src`, with shared primitives under `components`, feature pages in `pages`, and TRPC helpers in `utils`. Generated bundles land in each app’s `dist` directory, while end-to-end fixtures are isolated in `apps/backend/coverage-e2e` and uploads under `apps/backend/uploads`.

## Build, Test, and Development Commands
- `pnpm install` — install workspace dependencies (Node 22+ required).
- `pnpm --filter @c3-oss/vogal-backend start` — boot the API in watch mode with SWC.
- `pnpm --filter @c3-oss/vogal-frontend start` — launch the Vite dev server.
- `pnpm turbo run build` — type-check and bundle every workspace using the Turbo graph.
- `pnpm --filter @c3-oss/vogal-backend db:migrate` — apply Drizzle migrations (env vars must be loaded).

## Coding Style & Naming Conventions
All TypeScript is linted and formatted with Biome (`@c3-oss/config-biome`), enforcing 2-space indentation, single quotes, and sorted imports. Run `pnpm --filter <package> lint` before pushing; resolve straightforward issues with `lint:fix` and leave risky rewrites to reviewers. Backend files use PascalCase for classes, camelCase for functions and variables, and maintain `~` path aliases as defined in `tsconfig.json`. React components reside in PascalCase files (e.g., `DocumentsPage.tsx`), and CSS lives beside usage in `styles.css`.

## Testing Guidelines
Vitest powers both unit and integration suites. Execute `pnpm --filter @c3-oss/vogal-backend test` for deterministic unit tests or `pnpm --filter @c3-oss/vogal-backend test:e2e` to run TRPC smoke tests against the in-memory PGLite stack (the script sets `__USE_PGLITE=1`). Prefer placing specs alongside implementations in `__tests__` folders. Aim to keep coverage above the default V8 thresholds exposed by `test:coverage`; add fixtures under `apps/backend/test` when mocking external services.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits with enforced scopes. Use scopes that match workspace folders (e.g., `feat(backend): …`, `fix(frontend): …`, `chore(workspace): …`) to satisfy `commitlint.config.js`. Run `pnpm commit` for an interactive prompt when in doubt. Pull requests should describe the user-facing impact, note any schema or env changes, and link GitHub issues. Include before/after screenshots for UI tweaks and reference Vitest output or coverage deltas for backend work.

## Environment & Safety Notes
Copy `.env.example` (when available) into `.env.local` before starting services, and avoid checking secrets into Git. Docker compose files under `apps/backend` provision Postgres and workers for full-stack testing; prune containers when finished. Keep large artifacts, PDFs, and uploaded files out of commits—those paths are ignored locally but still review your diff before pushing.
