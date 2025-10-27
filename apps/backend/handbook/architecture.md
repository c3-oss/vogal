## Architecture

This project follows Hexagonal Architecture (Ports and Adapters) to ensure clean separation of concerns and testability:

### Core Layer (`src/core`)
The heart of the application containing pure business logic with no external dependencies:

- `application/usecase`: Business logic orchestrators
  - `IngestPdfUseCase`: Handles PDF processing and indexing
  - `SearchUseCase`: Manages semantic search operations
- `application/port`: Interface contracts for external systems
  - `EmbedderPort`: Text-to-vector embedding interface
  - `TextNormalizerPort`: Text cleaning and normalization interface
  - `VogalRepositoryPort`: Vector database operations interface
- `application/dto`: Data transfer objects for type safety

### Adapter Layer (`src/adapter`)
Implements the ports and provides external system integrations:

- `in/http`: HTTP API layer with Express.js
  - RESTful endpoints for document upload, search, and listing
  - Request validation and response formatting
- `out/ai`: AI service integrations
  - OpenAI embeddings for vector generation
  - OpenAI GPT for text normalization
- `out/vector-db`: Vector database implementations
  - Qdrant client for vector storage and search
- `out/db`: Database layer with Drizzle ORM
  - PostgreSQL schema definitions
  - PGLite support for development/testing

### Infrastructure Layer (`src/infra`)
Supporting utilities and configuration:

- Configuration Management: Environment-based configuration with validation
- Text Processing: Document chunking utilities
- Signal Handling: Graceful shutdown management

## Tech Stack

- Runtime: Node.js with TypeScript
- Framework: Express.js with middleware (Helmet, CORS, Multer)
- Database: PostgreSQL with Drizzle ORM + PGLite for testing
- Vector Database: Qdrant for similarity search
- AI Services: OpenAI (embeddings + GPT for text normalization)
- PDF Processing: pdf-parse library
- Testing: Vitest with coverage reporting
- Build Tools: Turborepo, tsup, Biome
- Package Manager: pnpm
