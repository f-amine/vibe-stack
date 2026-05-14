#!/bin/sh
# Nightly Postgres dump → Cloudflare R2.
# Required env: DATABASE_URL, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_BACKUP_PREFIX (default: backups)
set -eu

PREFIX="${R2_BACKUP_PREFIX:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="/tmp/db-${STAMP}.sql.gz"

echo "[backup] dumping ${DATABASE_URL%%@*}@<redacted> -> ${FILE}"
pg_dump --no-owner --no-privileges --format=plain "${DATABASE_URL}" | gzip -9 > "${FILE}"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION=auto

echo "[backup] uploading to r2://${R2_BUCKET}/${PREFIX}/db-${STAMP}.sql.gz"
aws --endpoint-url "${R2_ENDPOINT}" s3 cp "${FILE}" "s3://${R2_BUCKET}/${PREFIX}/db-${STAMP}.sql.gz"

# Retention: delete dumps older than 30 days
echo "[backup] pruning >30d"
CUTOFF=$(date -u -d "-30 days" +%Y%m%dT%H%M%SZ 2>/dev/null || \
  date -u -v-30d +%Y%m%dT%H%M%SZ 2>/dev/null || \
  echo "00000000T000000Z")
aws --endpoint-url "${R2_ENDPOINT}" s3 ls "s3://${R2_BUCKET}/${PREFIX}/" \
  | awk '{print $4}' | grep -E '^db-[0-9]{8}T[0-9]{6}Z\.sql\.gz$' | while read -r key; do
    STAMP_ONLY="${key#db-}"; STAMP_ONLY="${STAMP_ONLY%.sql.gz}"
    if [ "${STAMP_ONLY}" \< "${CUTOFF}" ]; then
      echo "[backup] deleting old ${key}"
      aws --endpoint-url "${R2_ENDPOINT}" s3 rm "s3://${R2_BUCKET}/${PREFIX}/${key}" || true
    fi
done

rm -f "${FILE}"
echo "[backup] done"
