# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Commands

This is a TypeScript monorepo using **pnpm workspaces** and **Turborepo**.

### Common Development Commands

**Building:**
```bash
# Build all packages (at root)
pnpm build

# Build specific workspace (run from workspace directory)
cd apps/backend
pnpm build

# Build includes typecheck + bundle
pnpm typecheck  # Type checking only
pnpm bundle     # Bundle only
```

**Linting:**
```bash
# Lint with Biome
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Fix including unsafe fixes
pnpm lint:fix-unsafe
```

**Testing:**
```bash
# Backend tests
cd apps/backend

# Unit tests
pnpm test
pnpm test:coverage

# E2E tests (uses PGLite)
pnpm test:e2e
pnpm test:e2e:coverage

# Run all checks (typecheck + bundle + test + lint)
pnpm check-all
```

**Database (Backend):**
```bash
cd apps/backend

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema to DB
pnpm db:push
```

**Running Applications:**
```bash
# Backend (uses dotenv-expand)
cd apps/backend
pnpm start

# Frontend (Vite dev server)
cd apps/frontend
pnpm start
```

### Package Modification Workflow

When modifying code in `packages/` or `apps/`, follow this order:
1. `pnpm lint:fix` - Fix linting issues
2. `pnpm build` - Ensure it builds successfully
3. Fix any errors before proceeding

Turborepo handles dependency ordering automatically via `^build` dependencies.

## Architecture

### Hexagonal Architecture (Ports & Adapters)

The backend (`apps/backend/src/`) implements hexagonal architecture with strict separation of concerns:

```
core/
  application/
    usecase/        # Business logic (ProcessPDF, Search, CRUD)
    port/           # Interface contracts for external services
    dto/            # Data Transfer Objects
adapter/
  in/               # Input adapters (HTTP, tRPC)
    http/           # Fastify REST endpoints
    trpc/           # Type-safe RPC procedures
    shared/         # Dependency injection (WiringContext)
  out/              # Output adapters (implementations)
    db/             # PostgreSQL + Drizzle ORM
    vector-db/      # Qdrant with caching layer
    ai/             # OpenAI embeddings & normalization
    storage/        # S3 & Firebase implementations
    cache/          # Redis adapter
    background/     # Event-driven saga orchestration
infra/
  config/           # Environment & configuration
  errors/           # Custom error hierarchy (VError)
  pdf/              # PDF parsing utilities
```

**Key Ports:**
- `vogal-repository.port.ts` - Vector database abstraction (Qdrant)
- `storage-provider.port.ts` - Cloud storage abstraction
- `embedder.port.ts` - Text embedding service
- `cache.port.ts` - Cache abstraction
- `background-processing.port.ts` - Async job processing

### Domain Model

Core entities in the document intelligence platform:
- **Workspace** - Multi-tenant container
- **User** - User accounts per workspace
- **Document** - Uploaded files (PDFs)
- **DocumentPage** - Extracted pages from documents
- **DocumentMetadata** - Extracted metadata (title, author)
- **DocumentUpload** - Upload tracking with saga states: `pending` → `storage_upload` → `file_reference` → `content_indexed` → `finalized`
- **VectorPoints** - Embeddings in Qdrant for semantic search

### Document Processing Flow

1. PDF uploaded via HTTP/tRPC
2. Stored in cloud storage (S3/Firebase)
3. PDF parsed into pages and text
4. Text normalized using OpenAI
5. Embeddings generated (OpenAI)
6. Indexed in Qdrant vector DB
7. Background saga orchestrates async steps

### Architectural Patterns

**Dependency Injection:**
- `WiringContext` in `adapter/in/shared/wiring.ts` orchestrates the dependency graph
- All adapters receive dependencies through constructors
- Use cases define `Deps` interface for required services

**Error Handling:**
- Custom `VError` base class with structured error codes (`VERR` enum)
- Result types use `Failable<T> = Either<Error, T>` from `@c3-oss/functional`
- Specific error types: `VErrorProcessingFailed`, `VErrorRateLimited`, `VErrorExternalServiceUnavailable`

**Use Case Pattern:**
- All use cases extend `BaseUseCase`
- Each receives typed `Deps` interface
- `invariant()` validates dependencies on construction
- Returns `Option<Error>` or `Failable<T>`

**Repository Pattern:**
- Base class `BaseRepository extends BaseAdapter`
- Caching repositories wrap base repositories (decorator pattern)
- Query results return `Failable<T>`

**Background Processing:**
- `EventEmitterBackgroundStrategy` implements saga pattern
- Separates async operations from request-response cycle
- Orchestrates multi-step document processing

## Key Dependencies

**Backend:**
- **Fastify** - HTTP server with plugins (CORS, Helmet, Multipart)
- **tRPC** - Type-safe RPC framework
- **Drizzle ORM** - PostgreSQL ORM with migrations
- **Qdrant** - Vector database for semantic search
- **OpenAI** - Embeddings and text processing
- **Redis** - Caching layer
- **AWS S3 / Firebase Storage** - Cloud storage providers
- **PGLite** - In-memory Postgres for E2E tests
- **Vitest** - Unit and E2E testing

**Frontend:**
- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Styling
- **Radix UI** - Component primitives
- **tRPC + TanStack Query** - API client
- **React Hook Form + Zod** - Form validation
- **React Router** - Routing

**Shared Tooling:**
- **Biome** - Linting and formatting
- **Turborepo** - Build orchestration
- **pnpm** - Package manager (v10.8.1)
- **TypeScript 5.9** - Type checking
- **Husky** - Git hooks
- **Commitizen + Commitlint** - Conventional commits

## C3 Internal Packages

The codebase uses C3 OSS utilities:
- `@c3-oss/functional` - Result/Option/Either types
- `@c3-oss/logger` - Structured logging
- `@c3-oss/typeguard` - Runtime type checking
- `@c3-oss/drizzle-ulid` - ULID support for Drizzle
- `@c3-oss/config-*` - Shared configs (Biome, TypeScript, Vitest, tsup)

## Testing Strategy

**Unit Tests:**
- Test individual use cases and adapters
- Mock external dependencies (ports)
- Run with `pnpm test`

**E2E Tests:**
- Use PGLite (in-memory Postgres) via `__USE_PGLITE=1`
- Test full workflows through HTTP/tRPC endpoints
- Run with `pnpm test:e2e`

**Coverage:**
- Generate coverage reports with `pnpm test:coverage` or `pnpm test:e2e:coverage`
- Configured via Vitest with V8 provider

## Important Conventions

**When modifying adapters:**
- Ensure ports (interfaces) remain stable
- Implementations should be swappable
- Test with dependency injection in mind

**When adding use cases:**
- Extend `BaseUseCase`
- Define `Deps` interface for required services
- Implement `invariant()` for dependency validation
- Return `Failable<T>` or `Option<Error>`

**When working with errors:**
- Use `VError` hierarchy for domain errors
- Add new error codes to `VERR` enum if needed
- Wrap external errors in `Failable<T>`

**When modifying database schema:**
- Update Drizzle schema in `adapter/out/db/models/`
- Run `pnpm db:generate` to create migrations
- Test migrations with `pnpm db:migrate`
