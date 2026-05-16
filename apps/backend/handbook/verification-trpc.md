# RAG tRPC Stack – Quick Verification Runbook

Target: Start and validate the tRPC adapter at `/trpc` using direct HTTP requests.

Assumptions: Docker Compose stack (`apps/rag/docker-compose.yml`) running.

## 1. Prerequisites
- Docker Compose stack running (`docker ps | grep rag_`)
- Working directory: `apps/rag/`
- Tools: `pnpm`, `psql`, `redis-cli`, `aws` (MiniStack), `curl`, `jq`, `base64`

## 2. Environment Setup
```bash
cd apps/rag

# Load environment variables
source .env

# Export required vars (if not in .env)
export DATABASE_URL="postgres://rag:rag@localhost:15432/rag"
export QDRANT_URL="http://localhost:16333"
export REDIS_URL="redis://localhost:16379"
```

## 3. Database Migration
```bash
pnpm db:migrate
```

## 4. S3 Bucket Setup
```bash
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
AWS_DEFAULT_REGION=us-east-1 \
aws --endpoint-url http://localhost:4566 s3 mb s3://rag
```

## 5. Start tRPC Server
```bash
# Kill any existing server
pkill -f "pnpm start trpc" || true

# Start with environment loaded
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
VOGAL_STORAGE_S3_FORCE_PATH_STYLE=true \
pnpm start trpc > /tmp/rag_trpc.log 2>&1 &

# Wait for startup (check logs)
sleep 3
tail -f /tmp/rag_trpc.log
```
Wait for: `RAG tRPC server running` and `Redis client connected`

## 6. tRPC API Basics
- **Base URL:** `http://localhost:3000/trpc`
- **Queries:** GET with `input={}` query param
- **Mutations:** POST with raw JSON body

## 7. Happy-Path Validation

### 7.1 Health Check
```bash
curl -sS -G --data-urlencode 'input={}' http://localhost:3000/trpc/health.get | jq
```

### 7.2 Create User
```bash
USER_ID=$(curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data-binary '{"name":"Test User","email":"testuser@example.com"}' \
  http://localhost:3000/trpc/users.create | jq -r '.result.data.id')
echo "User ID: $USER_ID"
```

### 7.3 Create Workspace
```bash
WORKSPACE_ID=$(curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data-binary "{\"name\":\"Test Workspace\",\"userId\":\"${USER_ID}\"}" \
  http://localhost:3000/trpc/workspaces.create | jq -r '.result.data.id')
echo "Workspace ID: $WORKSPACE_ID"
```

### 7.4 Upload PDF
```bash
# Create payload file to avoid argument size limits
PDF_PATH="pdfs/attention-is-all-you-need.pdf"
PDF_B64=$(base64 -i "$PDF_PATH")

cat > /tmp/upload_payload.json << EOF
{
  "body": {"workspaceId": "${WORKSPACE_ID}"},
  "filename": "attention-is-all-you-need.pdf",
  "contentType": "application/pdf",
  "fileB64": "${PDF_B64}"
}
EOF

DOC_ID=$(curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data @/tmp/upload_payload.json \
  http://localhost:3000/trpc/upload.pdfB64 | jq -r '.result.data.documentId')
echo "Document ID: $DOC_ID"
```

### 7.5 Monitor Processing
```bash
# Check status until ready (may take 1-2 minutes)
while true; do
  STATUS=$(curl -sS -G --data-urlencode "input={\"idExt\":\"${DOC_ID}\"}" \
    http://localhost:3000/trpc/documents.status | jq -r '.result.data.documentStatus')
  echo "Status: $STATUS"
  [[ "$STATUS" == "ready" ]] && break
  sleep 10
done
```

### 7.6 Test Search
```bash
curl -sS -G --data-urlencode "input={\"workspaceId\":\"${WORKSPACE_ID}\",\"query\":\"attention\",\"topK\":3}" \
  http://localhost:3000/trpc/search.query | jq '.result.data.hits'
```

## 8. Additional Tests

### Users Operations
```bash
# Get user by ID (query)
curl -sS -G --data-urlencode "input={\"idExt\":\"${USER_ID}\"}" \
  http://localhost:3000/trpc/users.getOne | jq

# List all users (query)
curl -sS -G --data-urlencode 'input={"page":1,"limit":10,"orderField":"createdAt","orderDirection":"desc"}' \
  http://localhost:3000/trpc/users.getAll | jq
```

### Workspace Operations
```bash
# Update workspace
curl -sS -X POST -H 'Content-Type: application/json' \
  --data-binary "{\"params\":{\"idExt\":\"${WORKSPACE_ID}\"},\"body\":{\"name\":\"Updated Workspace\"}}" \
  http://localhost:3000/trpc/workspaces.update | jq

# List documents (query)
curl -sS -G --data-urlencode "input={\"workspaceId\":\"${WORKSPACE_ID}\",\"page\":1,\"limit\":10,\"orderField\":\"createdAt\",\"orderDirection\":\"desc\"}" \
  http://localhost:3000/trpc/documents.list | jq
```

## 9. Service Verification

### PostgreSQL
```bash
psql "$DATABASE_URL" -c "
  SELECT 'Users:' as section, COUNT(*) as count FROM users.users
  UNION ALL
  SELECT 'Workspaces:', COUNT(*) FROM workspaces.workspaces
  UNION ALL
  SELECT 'Documents:', COUNT(*) FROM documents.documents
  UNION ALL
  SELECT 'Uploads:', COUNT(*) FROM documents.document_uploads;
"

psql "$DATABASE_URL" -c "
  SELECT d.id_ext, d.filename, d.status,
         u.current_step, u.last_completed_step
  FROM documents.documents d
  LEFT JOIN documents.document_uploads u ON u.job_id_ext = d.id_ext
  ORDER BY d.created_at DESC LIMIT 5;
"
```

### Redis Cache
```bash
redis-cli -h 127.0.0.1 -p 16379 -a rag --raw keys "rag:development:*"
```

### Qdrant Vector Store
```bash
# List collections
curl -sS -H 'api-key: token' \
  http://localhost:16333/collections | jq '.result.collections[].name'

# Check embeddings count
curl -sS -H 'api-key: token' \
  -H 'Content-Type: application/json' \
  -d '{"exact":true}' \
  http://localhost:16333/collections/${WORKSPACE_ID} | jq '.result.points_count'
```

### S3 Storage
```bash
aws --endpoint-url http://localhost:4566 s3 ls s3://rag/documents/${DOC_ID}/
```

## 10. Cleanup
```bash
# Stop server
pkill -f "pnpm start trpc"

# Optional: Clean test data
psql "$DATABASE_URL" -c "
  DELETE FROM documents.document_uploads;
  DELETE FROM documents.documents;
  DELETE FROM workspaces.workspaces;
  DELETE FROM users.users;
"
```

## 11. Troubleshooting

### Common Issues
- **Server won't start:** Check if port 3000 is free, verify `.env` is loaded
- **OpenAI errors:** Ensure `OPENAI_API_KEY` is set and valid in `.env`
- **Database connection:** Verify PostgreSQL container is running
- **S3 errors:** Confirm bucket exists and AWS credentials are set
- **Processing stuck:** Check `/tmp/rag_trpc.log` for detailed errors

### Debug Commands
```bash
# Check server logs
tail -f /tmp/rag_trpc.log

# Verify environment
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}..."
echo "DATABASE_URL: $DATABASE_URL"
echo "QDRANT_URL: $QDRANT_URL"

# Test connectivity
curl -s http://localhost:3000/trpc/health.get | head -5
```
