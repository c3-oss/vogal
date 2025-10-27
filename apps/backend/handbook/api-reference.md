## API Reference

The API provides RESTful endpoints for document management and semantic search. All endpoints return JSON responses.

### Upload Document (asynchronous)

POST `/upload`

Request:
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with key `pdf` and form field `workspaceIdExt`

Response:
```json
{
  "documentId": "ulid"
}
```

Example:
```bash
curl -X POST -F "pdf=@document.pdf" -F "workspaceIdExt=WS_xxx" http://localhost:3000/upload
```

### Check document processing status

GET `/documents/:idExt/status`

Response:
```json
{
  "id": 1,
  "documentId": 12,
  "status": "queued|processing|completed|failed",
  "errorMessage": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Semantic Search

GET `/search`

Perform semantic search across all indexed documents.

Query Parameters:
- `q` (required): Search query string
- `limit` (optional): Maximum number of results (default: 5)
- `documentId` (optional): Filter results to specific document

Response:
```json
{
  "query": "machine learning algorithms",
  "totalFound": 3,
  "results": [
    {
      "score": 0.89,
      "documentId": "uuid-string",
      "filename": "ml_guide.pdf",
      "pageNumber": 5,
      "chunkIndex": 12,
      "text": "Machine learning algorithms can be broadly classified into...",
      "metadata": {
        "title": "Machine Learning Guide",
        "author": "John Doe",
        "totalPages": 150
      }
    }
  ]
}
```

Examples:
```bash
# Basic search
curl "http://localhost:3000/search?q=machine%20learning"

# Limited results
curl "http://localhost:3000/search?q=neural%20networks&limit=10"

# Search within specific document
curl "http://localhost:3000/search?q=algorithms&documentId=uuid-string"
```

### List Documents

GET `/documents`

Retrieve a list of all indexed documents with metadata.

Response:
```json
{
  "documents": [
    {
      "documentId": "uuid-string",
      "filename": "ml_guide.pdf",
      "totalPages": 150,
      "title": "Machine Learning Guide",
      "author": "John Doe",
      "chunksCount": 325
    }
  ]
}
```

Example:
```bash
curl http://localhost:3000/documents
```

### Health Check

GET `/`

Basic health check endpoint.

Response:
```json
"Vogal HTTP server"
```
