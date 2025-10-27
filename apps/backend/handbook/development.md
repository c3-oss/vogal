## Development

### Available Scripts

```bash
# Start development server
pnpm start

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Database operations
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:push        # Push schema changes
```

### Testing

The project uses Vitest for testing with the following setup:

- Test Database: PGLite (in-memory PostgreSQL) for isolated testing
- Coverage: V8 coverage provider with HTML, JSON, and text reports
- Global Setup: Database initialization and cleanup

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run specific test file
pnpm test src/core/application/usecase/__tests__/search.ts
```

### Database Development

The project supports two database modes:

1. PGLite (Development/Testing): In-memory database, no setup required
2. PostgreSQL (Production): Full PostgreSQL instance

Switching between modes:
- Set `__USE_PGLITE=1` environment variable for PGLite mode
- Unset or set `__USE_PGLITE=0` for PostgreSQL mode

Database operations:
```bash
# Generate new migrations from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Application environment |
| `HTTP_PORT` | No | `3000` | Server port |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for embeddings and normalization |
| `DATABASE_URL` | Yes* | - | PostgreSQL connection string (*not required in PGLite mode) |
| `QDRANT_URL` | No | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_API_KEY` | No | - | Qdrant API key (optional for local) |
| `VOGAL_COLLECTION_NAME` | No | `documents` | Qdrant collection name |
| `VOGAL_EMBEDDING_MODEL` | No | `text-embedding-3-small` | OpenAI embedding model |
| `VOGAL_NORMALIZATION_MODEL` | No | `gpt-4o-mini` | OpenAI model for text normalization |
| `VOGAL_CHUNK_SIZE` | No | `1000` | Text chunk size in characters |
| `VOGAL_CHUNK_OVERLAP` | No | `200` | Overlap between chunks |
| `REDIS_URL` | No | - | Redis connection string for cache (enables caching when set) |
| `__USE_PGLITE` | No | - | Enable PGLite instead of PostgreSQL |

### Processing Pipeline

The system processes PDFs through the following pipeline:

1. PDF Parsing: Extract text from each page using `pdf-parse`
2. Text Normalization: Clean and standardize text using OpenAI GPT
3. Text Chunking: Split text into overlapping chunks for better retrieval
4. Embedding Generation: Convert text chunks to vectors using OpenAI embeddings
5. Vector Storage: Store vectors in Qdrant with metadata
6. Search: Perform similarity search using cosine distance
