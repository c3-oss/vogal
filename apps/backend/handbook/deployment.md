## Deployment

### Production Setup

1. Database: Set up PostgreSQL and run migrations:
   ```bash
   pnpm db:migrate
   ```

2. Qdrant: Configure Qdrant instance (local or cloud)

3. Environment: Set production environment variables

4. Build and Start:
   ```bash
   pnpm build
   pnpm start
   ```

### Docker Deployment

Example `docker-compose.yml` for production:

```yaml
version: '3.8'
services:
  rag-api:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/rag
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=your_key_here
    depends_on:
      - postgres
      - qdrant

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=rag
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  qdrant:
    image: qdrant/qdrant
```
