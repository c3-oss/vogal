#!/usr/bin/env bash
set -euo pipefail

BUCKET="${VOGAL_STORAGE_S3_BUCKET:-rag}"
aws s3 mb "s3://${BUCKET}" || true
