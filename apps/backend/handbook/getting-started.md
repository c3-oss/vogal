## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for production) or automatic setup for development
- Qdrant vector database (local or cloud instance)
- OpenAI API account and key

### Installation

1. Clone and navigate to the project:
   ```bash
   cd apps/rag
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Environment Configuration:
   Create a `.env` file in the `apps/rag` directory:

   ```bash
   # Server Configuration
   NODE_ENV=development
   HTTP_PORT=3000

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   VOGAL_EMBEDDING_MODEL=text-embedding-3-small
   VOGAL_NORMALIZATION_MODEL=gpt-4o-mini

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/rag_db

   # Qdrant Vector Database
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your_qdrant_api_key  # optional for local instances
   VOGAL_COLLECTION_NAME=documents

   # Processing Configuration
   VOGAL_CHUNK_SIZE=1000
   VOGAL_CHUNK_OVERLAP=200

   # Development Mode (optional - enables PGLite instead of PostgreSQL)
   __USE_PGLITE=1
   ```

   > Note: All environment variables are validated at startup. Refer to `src/infra/config/env.ts` for complete requirements.

### Quick Start

1. Start Qdrant (if using local instance):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

2. Start the development server:
   ```bash
   pnpm start
   ```

3. Test the API:
   ```bash
   curl http://localhost:3000
   # Should return: "Vogal HTTP server"
   ```
