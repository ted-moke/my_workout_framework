#!/usr/bin/env bash
# Deploy origin/main to the Docker Compose stack on this machine.
#
# Usage (from the deploy checkout, e.g. ~/dev/workout-tracker):
#   scripts/deploy.sh [migration.sql ...]
#
# Migrations are file names in server/migrations/, applied in the order given.
# They are written to be idempotent, so re-running one is safe.
#
# Steps: back up the DB, fast-forward to origin/main, apply migrations, rebuild
# and restart only the app (plus the tunnel, which shares the app's network),
# then verify the app and that no sets were lost.
set -euo pipefail
cd "$(dirname "$0")/.."

APP_URL="${APP_URL:-http://localhost:7000}"

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# Run psql (or pg_dump) inside the db container as the configured user/db.
db_psql() { docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' psql "$@"; }
db_dump() { docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'; }
sets_count() { db_psql -tAc "SELECT count(*) FROM sets"; }

log "Preflight"
[ "$(git branch --show-current)" = "main" ] || die "deploy checkout must be on main"
git diff --quiet && git diff --cached --quiet || die "deploy checkout has uncommitted changes"
[ -n "$(docker compose ps -q --status running db)" ] || die "db service is not running"
tunnel_running="$(docker compose ps -q --status running tunnel)"

log "Backing up database"
mkdir -p backup
backup_file="backup/backup-pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
db_dump > "$backup_file"
grep -q "PostgreSQL database dump complete" "$backup_file" || die "backup looks incomplete: $backup_file"
echo "Saved $backup_file ($(du -h "$backup_file" | cut -f1))"
sets_before="$(sets_count)"
echo "sets rows before: $sets_before"

log "Fast-forwarding to origin/main"
git fetch origin main
git merge --ff-only origin/main
git log --oneline -1

for migration in "$@"; do
  file="server/migrations/$migration"
  [ -f "$file" ] || die "migration not found: $file"
  log "Applying $migration"
  db_psql -1 < "$file"
done

log "Rebuilding and restarting app"
docker compose up -d --build --no-deps app
if [ -n "$tunnel_running" ]; then
  # The tunnel runs in the app container's network namespace, so it must be
  # recreated along with the app or it loses its connection.
  docker compose up -d --no-deps --force-recreate tunnel
fi

log "Verifying"
for _ in $(seq 1 30); do
  curl -fsS --max-time 5 -o /dev/null "$APP_URL/" && break
  sleep 2
done
curl -fsS --max-time 5 -o /dev/null "$APP_URL/" || die "$APP_URL/ is not responding"
echo "$APP_URL/ OK"

user_id="$(curl -fsS --max-time 10 "$APP_URL/api/users" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)"
if [ -n "$user_id" ]; then
  curl -fsS --max-time 10 -o /dev/null "$APP_URL/api/users/$user_id/exercise-stats" \
    || die "exercise-stats endpoint failed"
  echo "$APP_URL/api/users/$user_id/exercise-stats OK"
fi

sets_after="$(sets_count)"
echo "sets rows after: $sets_after"
[ "$sets_after" = "$sets_before" ] || die "sets row count changed ($sets_before -> $sets_after); backup: $backup_file"

if [ -n "$tunnel_running" ]; then
  [ -n "$(docker compose ps -q --status running tunnel)" ] || die "tunnel is not running"
  echo "tunnel running"
fi

log "Deploy complete. Backup: $backup_file"
