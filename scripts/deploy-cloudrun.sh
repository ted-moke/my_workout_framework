#!/usr/bin/env bash
# Deploy origin/main to Cloud Run, with the database on Neon.
#
# Usage (from a checkout of this repo):
#   scripts/deploy-cloudrun.sh [migration.sql ...]
#
# Migrations are file names in server/migrations/, applied to Neon in the order
# given, each in its own transaction. They are written to be idempotent.
#
# Settings (env vars, defaults in brackets):
#   GCP_PROJECT (required)                    REGION [us-east4]
#   SERVICE [workout-tracker]                SECRET [database-url]
#
# Steps: fast-forward to origin/main, apply migrations to Neon using the
# DATABASE_URL stored in Secret Manager, build and deploy from source with
# Cloud Build, then check the new revision answers.
#
# Needs: gcloud (logged in), git, node/npm. No Docker.
set -euo pipefail
cd "$(dirname "$0")/.."

# No fallback to gcloud's current project, so a deploy can't land in another project.
GCP_PROJECT="${GCP_PROJECT:?set GCP_PROJECT to the workout tracker GCP project id}"
REGION="${REGION:-us-east4}"
SERVICE="${SERVICE:-workout-tracker}"
SECRET="${SECRET:-database-url}"

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

log "Preflight (project $GCP_PROJECT, region $REGION, service $SERVICE)"
[ "$(git branch --show-current)" = "main" ] || die "checkout must be on main"
git diff --quiet && git diff --cached --quiet || die "checkout has uncommitted changes"

log "Fast-forwarding to origin/main"
git fetch origin main
git merge --ff-only origin/main
git log --oneline -1

if [ "$#" -gt 0 ]; then
  for migration in "$@"; do
    [ -f "server/migrations/$migration" ] || die "migration not found: server/migrations/$migration"
  done
  log "Applying migrations to Neon: $*"
  echo "(Neon keeps a 6-hour restore window on the free plan; restore from the console if one goes wrong.)"
  DATABASE_URL="$(gcloud secrets versions access latest --secret="$SECRET" --project="$GCP_PROJECT")"
  (cd server && npm ci --silent && DATABASE_URL="$DATABASE_URL" npx tsx src/migrate.ts "$@")
fi

log "Building and deploying (Cloud Build, a few minutes)"
gcloud run deploy "$SERVICE" \
  --project="$GCP_PROJECT" \
  --region="$REGION" \
  --source=. \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --cpu=1 \
  --memory=512Mi \
  --cpu-boost \
  --concurrency=80 \
  --timeout=60 \
  --set-env-vars=NODE_ENV=production,TZ=America/New_York \
  --set-secrets=DATABASE_URL="$SECRET":latest \
  --quiet

log "Verifying"
url="$(gcloud run services describe "$SERVICE" --project="$GCP_PROJECT" --region="$REGION" --format='value(status.url)')"
curl -fsS --max-time 30 -o /dev/null "$url/" || die "$url/ is not responding"
echo "$url/ OK"
user_id="$(curl -fsS --max-time 30 "$url/api/users" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)"
[ -n "$user_id" ] || die "$url/api/users returned no users (database connection?)"
curl -fsS --max-time 30 -o /dev/null "$url/api/users/$user_id/exercise-stats" || die "exercise-stats endpoint failed"
echo "$url/api/users/$user_id/exercise-stats OK"

log "Deploy complete: $url"
