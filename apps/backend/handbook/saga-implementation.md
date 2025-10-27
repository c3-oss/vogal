# SAGA Strategy for the Ingestion Pipeline (2025-10-22)

This document summarizes all work performed to make the PDF ingestion pipeline resilient using a SAGA pattern, including code changes, migrations, tests, and verifications executed.

## 1. Objective
Ensure that PDF uploads are atomic and recoverable. If any step (upload to storage, persistence in Postgres, indexing in Qdrant, etc.) fails, the system must execute compensations and not leave inconsistent residues.

## 2. Schema Changes
- `documents.documents`: Added `status` (`pending`, `processing`, `failed`, `ready`) and `failure_reason`.
- `documents.document_uploads`: Now stores saga job (`job_id_ext` ULID), internal/external IDs, storage data, current/completed step, retry counters, and heartbeat timestamps.
- New enums `document_status` and `upload_step`.
- Migration recorded in `src/adapter/out/db/migration/pg/0006_cooing_lord_hawal.sql`.

## 3. Repositories and Ports
- `DocumentWriteAdapter`: Cleanup methods (delete metadata/pages/file) and status updates.
- `DocumentUploadRepository`: Supports reading by job/document with document metadata and partial updates.
- `DocumentFile/Metadata/Page` repositories: Functions to remove records by document.
- `StorageProviderPort`: New `remove` method implemented for S3 and Firebase.
- `VogalRepositoryPort`: New `deleteDocumentVectors` method (with support in `QdrantRepository` and cache decorator).

## 4. Background Strategy (SAGA)
- `EventEmitterBackgroundStrategy` refactored to orchestrate the steps:
  1. Upload to storage (commit + rollback).
  2. Save file reference.
  3. Parsing + persistence of pages/metadata + Qdrant indexing.
  4. Finalization (status `ready`) or complete compensations.
- Each step is idempotent and records progress in `document_uploads`.
- In case of failure, executes compensations in reverse order (removal in storage, Qdrant, Postgres) and marks the document as `failed`.
- Temporary files are always cleaned up at the end.

## 5. Controllers / Adapters
- `/upload` (HTTP and tRPC) now only creates the record in the database and schedules the job; storage and parsing occur in the background.
- `/documents/:id/status` exposes enriched information: jobId, current step, retries, document status, and storage metadata.
- `buildContext`: Injects the storage provider and writer into the background strategy; the `WiringContext` object no longer exposes `.storage`.

## 6. Tests
- `EventEmitterBackgroundStrategy`:
  - Job queuing;
  - Complete execution with success;
  - Flow with compensations (processing failure) covering deletions and status updates.
- `UploadController` adjusted to reflect new behavior (cleanup of temp file on errors).
- `DocumentStatusController` updated for the new payload.

## 7. Tools / Verification
- Ran `pnpm check-all` (typecheck, bundle, vitest with coverage, biome) after the changes.
- Added `VERIFICATION.md` with step-by-step instructions to set up the environment, test flows, and inspect services.
- `biome.json`: Ignores `.volumes`, `uploads`, and `pdfs` directories to avoid linting runtime artifacts.

## 8. Suggested Future Actions
- Integrate a durable queue (SQS/Redis queue) to persist jobs outside the Node process.
- Create retry/backoff mechanisms and a "janitor" for stuck jobs.
- Evaluate cleanup of old records pre-migration to avoid orphaned documents.

## 9. Useful Commands
```bash
# Run local checks (lint, typecheck, bundle, tests + coverage)
pnpm check-all

# Execute only background tests
pnpm vitest --config test-unit.config.ts --run src/adapter/out/background/__tests__/event-emitter.strategy.test.ts
```

> All mentioned paths and files are relative to `apps/rag`.
