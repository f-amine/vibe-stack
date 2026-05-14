#!/bin/sh
# Restore latest (or given) backup from R2 into DATABASE_URL.
# Usage: ./scripts/restore-r2.sh [db-YYYYMMDDTHHMMSSZ.sql.gz]
set -eu

PREFIX="${R2_BACKUP_PREFIX:-backups}"
KEY="${1:-}"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION=auto

if [ -z "${KEY}" ]; then
  KEY=$(aws --endpoint-url "${R2_ENDPOINT}" s3 ls "s3://${R2_BUCKET}/${PREFIX}/" \
        | awk '{print $4}' | sort | tail -n 1)
fi

if [ -z "${KEY}" ]; then
  echo "no backups found in r2://${R2_BUCKET}/${PREFIX}/" >&2
  exit 1
fi

FILE="/tmp/${KEY}"
echo "downloading r2://${R2_BUCKET}/${PREFIX}/${KEY}"
aws --endpoint-url "${R2_ENDPOINT}" s3 cp "s3://${R2_BUCKET}/${PREFIX}/${KEY}" "${FILE}"

echo "restoring into ${DATABASE_URL%%@*}@<redacted>"
gunzip -c "${FILE}" | psql "${DATABASE_URL}"

rm -f "${FILE}"
echo "restore complete"
