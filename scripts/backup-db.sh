#!/usr/bin/env bash

# Database Backup Script for Kids Petite
#
# This script creates a compressed PostgreSQL backup and optionally uploads to S3-compatible storage.
#
# Usage:
#   ./scripts/backup-db.sh [s3-upload]
#
# If "s3-upload" is passed, the backup will be uploaded to S3 using rclone or aws cli.
# Requires S3 credentials in env: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT (optional)

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="kidspetite-db-${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Get DATABASE_URL from environment (Railway provides this)
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is required"
  exit 1
fi

echo "Starting database backup at $(date)"
echo "Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"

# Perform backup using pg_dump
# If DATABASE_URL is in format postgresql://user:pass@host:port/db
PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):\([^@]*\)@.*/\2/p')
USERHOST=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):\([^@]*\)@\(.*\)/\1@\3/p')
DBNAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Fallback: parse without password if PGPASSWORD extraction failed
if [ -z "$PGPASSWORD" ]; then
  # try again: maybe no password
  USERHOST=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\)@\(.*\)/\1@\2/p')
  DBNAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
fi

# Use pg_dump with connection string directly (simpler)
echo "Dumping database..."
pg_dump "$DATABASE_URL" --format=p --no-owner --no-acl | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "Backup completed: ${BACKUP_SIZE}"

# Optional: upload to S3
if [ "$1" = "s3-upload" ]; then
  if [ -z "${S3_BUCKET:-}" ]; then
    echo "ERROR: S3_BUCKET is required for S3 upload"
    exit 1
  fi

  echo "Uploading to S3 bucket: $S3_BUCKET"
  S3_PATH="s3://${S3_BUCKET}/backups/${BACKUP_FILE}"

  if command -v rclone &> /dev/null; then
    rclone copy "${BACKUP_DIR}/${BACKUP_FILE}" "$S3_PATH" \
      --progress \
      --s3-access-key-id="$S3_ACCESS_KEY_ID" \
      --s3-secret-access-key="$S3_SECRET_ACCESS_KEY" \
      ${S3_ENDPOINT:+--s3-endpoint="$S3_ENDPOINT"}
  elif command -v aws &> /dev/null; then
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "$S3_PATH" \
      --storage-class STANDARD_IA
  else
    echo "ERROR: Neither rclone nor aws cli is installed for S3 upload"
    exit 1
  fi

  echo "Upload completed to $S3_PATH"
fi

# Clean up old local backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "kidspetite-db-*.sql.gz" -mtime +"$RETENTION_DAYS" -delete || true

echo "Backup script finished successfully at $(date)"
