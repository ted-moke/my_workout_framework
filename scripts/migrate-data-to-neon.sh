#!/usr/bin/env bash
# One-time copy of the production database (local Docker Compose `db`) into Neon.
#
# Usage (from the deploy checkout, e.g. ~/dev/workout-tracker):
#   NEON_DIRECT_URL='postgresql://neondb_owner:...@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require' \
#     scripts/migrate-data-to-neon.sh
#
# Use Neon's *direct* connection string (host without "-pooler") for the restore.
#
# Steps: check the Neon database is empty, pg_dump the local db (read-only) to
# backup/backup-pre-neon-<timestamp>.sql, restore it into Neon in one
# transaction, then compare every table's row count and every sequence's value.
# The local database is only read, never changed.
#
# Needs Docker (pg_dump runs inside the db container; psql runs from PSQL_IMAGE).
set -euo pipefail
cd "$(dirname "$0")/.."

: "${NEON_DIRECT_URL:?set NEON_DIRECT_URL to the Neon direct connection string}"
# Match the Neon project's Postgres major version (16, same as local prod).
PSQL_IMAGE="${PSQL_IMAGE:-postgres:16-alpine}"

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

local_psql() { docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' psql "$@"; }
local_dump() { docker compose exec -T db sh -c 'pg_dump --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; }
neon_psql() { docker run --rm -i --network host "$PSQL_IMAGE" psql "$NEON_DIRECT_URL" -v ON_ERROR_STOP=1 -X "$@"; }

# "table|rows" for every table in public, then "seq:name|last_value" per sequence.
SNAPSHOT_SQL="
SELECT table_name || '|' || (xpath('/row/c/text()',
         query_to_xml(format('SELECT count(*) AS c FROM public.%I', table_name), false, true, '')))[1]::text
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'seq:' || sequencename || '|' || coalesce(last_value::text, 'null')
  FROM pg_sequences WHERE schemaname = 'public'
ORDER BY 1;"

log "Preflight"
[ -n "$(docker compose ps -q --status running db)" ] || die "local db service is not running"
neon_psql -tAc "SELECT version()" || die "cannot connect to Neon"
neon_tables="$(neon_psql -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")"
[ "$neon_tables" = "0" ] || die "Neon database already has $neon_tables tables in public; restore into an empty database"

log "Dumping local database (read-only)"
mkdir -p backup
dump_file="backup/backup-pre-neon-$(date +%Y%m%d-%H%M%S).sql"
local_dump > "$dump_file"
grep -q "PostgreSQL database dump complete" "$dump_file" || die "dump looks incomplete: $dump_file"
echo "Saved $dump_file ($(du -h "$dump_file" | cut -f1))"
local_psql -tA -c "$SNAPSHOT_SQL" > "$dump_file.counts"

log "Restoring into Neon"
neon_psql --single-transaction -q < "$dump_file" > /dev/null

log "Verifying row counts and sequences"
neon_counts="$(neon_psql -tA -c "$SNAPSHOT_SQL")"
if diff <(cat "$dump_file.counts") <(printf '%s\n' "$neon_counts"); then
  column -t -s '|' "$dump_file.counts"
  rm "$dump_file.counts"
  log "Neon matches the local database. Dump: $dump_file"
else
  die "local (<) and Neon (>) differ; see above. Dump: $dump_file"
fi
