# RAG HTTP Stack – Quick Verification Runbook

This is a future-me reminder on how to bring up the RAG HTTP adapter locally, exercise the main flows, and confirm every dependent service is working.

## 1. Prerequisites
- Docker Compose stack (`apps/rag/docker-compose.yml`) must already be running.
- Use the project root as working directory unless noted.
- Environment relies on `.env`; values referencing other vars are **not** expanded automatically when using `tsx/drizzle-kit`, so export overrides when needed.
- CLI tools needed: `pnpm`, `psql`, `redis-cli`, `aws` (pointed at Localstack), `curl`.

## 2. Baseline Checks
```bash
# confirm services are up (requires privileged shell)
docker ps | grep rag_

# quick health ping once the app is running later
curl -sS http://localhost:3000/ | jq
```

## 3. Database Prep
Drizzle expects explicit connection strings; set them before running migrations.
```bash
export DATABASE_URL="postgres://rag:rag@localhost:15432/rag"
export QDRANT_URL="http://localhost:16333"

# execute existing migrations
pnpm db:migrate
```

## 4. S3 Bucket on Localstack
Uploads fail until the bucket exists. Create it once per fresh environment.
```bash
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
AWS_DEFAULT_REGION=us-east-1 \
aws --endpoint-url http://localhost:4566 s3 mb s3://rag
```

## 5. Start the HTTP Adapter
Force path-style so Localstack accepts the bucket hostnames; keep test AWS creds in the environment during the run.
```bash
AWS_ACCESS_KEY_ID=test \
AWS_SECRET_ACCESS_KEY=test \
VOGAL_STORAGE_S3_FORCE_PATH_STYLE=true \
pnpm start http > /tmp/rag_http.log 2>&1 &
tail -f /tmp/rag_http.log
```
Wait for:
- `Redis client connected`
- `RAG server running`

## 6. Happy-Path Smoke
Use the generated ULIDs for later steps.
```bash
# create user
USER_ID=$(curl -sS -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"testuser@example.com"}' \
  http://localhost:3000/users | jq -r '.id')

# create workspace tied to user
WORKSPACE_ID=$(curl -sS -H 'Content-Type: application/json' \
  -d "{\"name\":\"Test Workspace\",\"userId\":\"${USER_ID}\"}" \
  http://localhost:3000/workspaces | jq -r '.id')

# upload PDF (apps/rag/pdfs has samples)
DOC_ID=$(curl -sS -D /tmp/upload.headers \
  -F "pdf=@pdfs/attention-is-all-you-need.pdf" \
  -F "workspaceId=${WORKSPACE_ID}" \
  http://localhost:3000/upload | jq -r '.documentId')
grep HTTP/1.1 /tmp/upload.headers   # should be 202
```
Watch `/tmp/rag_http.log` until you see `PDF processing completed`.

## 7. Service Verification
### Postgres
```bash
psql "$DATABASE_URL" -c "select id_ext,name,email from users.users;"
psql "$DATABASE_URL" -c "select id_ext,name from workspaces.workspaces;"
psql "$DATABASE_URL" -c "select id_ext,filename,status,failure_reason from documents.documents;"
psql "$DATABASE_URL" -c "select job_id_ext,status,current_step,last_completed_step,error_message from documents.document_uploads order by id desc limit 5;"
```

### Localstack S3
```bash
aws --endpoint-url http://localhost:4566 s3 ls s3://rag/documents/${DOC_ID}/
```

### Qdrant
```bash
curl -sS -H 'api-key: token' \
  http://localhost:16333/collections | jq
curl -sS -H 'api-key: token' \
  http://localhost:16333/collections/${WORKSPACE_ID} | jq
curl -sS -H 'api-key: token' \
  -H 'Content-Type: application/json' \
  -d '{"limit":1}' \
  http://localhost:16333/collections/${WORKSPACE_ID}/points/scroll | jq
```

### Redis Cache
```bash
redis-cli -h 127.0.0.1 -p 16379 -a rag keys "rag:development:*"
redis-cli -h 127.0.0.1 -p 16379 -a rag JSON.GET "rag:development:documents:list:*"
```

### HTTP Sanity
```bash
curl -sS "http://localhost:3000/documents?workspaceId=${WORKSPACE_ID}" | jq
curl -sS "http://localhost:3000/documents/${DOC_ID}/status" | jq
curl -sS "http://localhost:3000/search?workspaceId=${WORKSPACE_ID}&query=attention" | jq
```

## 8. Cleanup (optional)
- Stop the server: `kill <pid>` (from the background start command).
- Remove test data if desired via DELETE endpoints or manual SQL.

## 9. Troubleshooting Notes
- `drizzle-kit` complaining about `QDRANT_URL` usually means the env var wasn't exported; set it explicitly as in §3.
- 503 on upload with "bucket does not exist" → create bucket (§4) and restart the server (env var is read at boot).
- Missing Redis keys after requests → ensure `redis-stack` container is up (`docker ps`).
- If ingestion stalls, tail `/tmp/rag_http.log` for `ProcessPdfUseCase` errors and confirm OpenAI credentials are set (ingestion uses embeddings + normalization).
