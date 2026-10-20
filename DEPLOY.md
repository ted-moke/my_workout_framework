# Deployment Guide

Production is moving from Docker Compose on the home PC to **Google Cloud Run** (app, scales to zero) and **Neon** (Postgres, scales to zero), with `workout.themokes.org` served through a **Cloudflare Worker**. Sections:

1. [Production on Cloud Run + Neon](#production-on-cloud-run--neon): costs, one-time setup, routine deploys and migrations
2. [Moving production off the PC](#moving-production-off-the-pc): data migration, cutover, rollback, decommissioning
3. [Local Docker Compose stack](#local-docker-compose-stack-old-production-and-rollback-target): the old production setup, kept for local dev and rollback

## Production on Cloud Run + Neon

```
browser → Cloudflare (workout.themokes.org, Worker) → Cloud Run (us-east4, *.run.app) → Neon (AWS us-east-1, pooled)
```

- **App:** the root `Dockerfile`, built by Cloud Build from source (`gcloud run deploy --source .`). Cloud Run sets `PORT` (8080). Settings: min 0 and max 2 instances, 1 vCPU, 512 MiB, startup CPU boost, request-based billing (CPU only while serving requests).
- **Database:** a Neon project on the Free plan, Postgres 16 (the same major version as the old local db). The app connects through Neon's **pooled** connection string, stored in Secret Manager as `database-url` and passed to the app as `DATABASE_URL`.
- **Domain:** a Cloudflare Worker (`deploy/cloudflare-worker.js`) on the route `workout.themokes.org/*` forwards requests to the `*.run.app` URL. A plain proxied CNAME to `run.app` returns 404 because Cloud Run routes by Host header, and Cloudflare only lets Enterprise plans override it. Cloud Run domain mappings are still Preview and need the Cloudflare proxy turned off.
- **Cold start:** after about 15 idle minutes the Cloud Run instance stops. After 5 idle minutes Neon suspends; that can't be changed on the Free plan. The first request after a quiet spell waits for both to wake: about 1–3 s for Node, plus a few hundred ms for Neon.

### What the app does for Cloud Run (server/src/db.ts, index.ts)

- `DATABASE_URL` takes precedence over the `DB_*` vars. With it, TLS is on and the certificate is verified. `sslmode=disable` (local testing) and `sslmode=no-verify` are honoured, and `channel_binding=require` turns on SCRAM channel binding. Without it, the `DB_*` vars work as before, without TLS, so local docker compose is unchanged.
- The pool is small (`DB_POOL_MAX`, default 5) and closes idle connections after 10 s.
- Cloud Run throttles the CPU between requests, so a connection Neon closed while the app sat idle may not be noticed in time. Before a client that has been idle for 30 s or more is reused, the pool sends it `SELECT 1` and replaces it if it's dead. Errors on idle connections are logged; they don't crash the process.
- On `SIGTERM` the server stops accepting connections and closes the pool. There is no background work.

### Costs (checked 2026-10-19)

Expected bill: **$0/month** at one user's traffic. A billing account with a card is still required on the GCP side.

| Service | Free allowance | Our use | Past the allowance |
|---------|----------------|---------|--------------------|
| Cloud Run (request-based, Tier 1 region) | 180,000 vCPU-s, 360,000 GiB-s, 2M requests per month, per billing account | minutes of CPU a day | ~$0.000024/vCPU-s, $0.40 per 1M requests |
| Cloud Build | 2,500 build-minutes/month (e2-standard-2; Google calls it promotional) | ~3–5 min per deploy | $0.006/min |
| Artifact Registry | 0.5 GB storage | ~150 MB per image; the cleanup policy keeps 3 | ~$0.10/GB-month |
| Secret Manager | 6 active secret versions, 10,000 accesses/month | 1 version, read at each instance start | $0.06/version-month |
| Cloud Storage (Cloud Build source uploads) | 5 GB-month in US regions | a few MB per deploy | ~$0.02/GB-month |
| Neon Free | 1 GB storage and 100 CU-hours per project per month; 6 h restore window; no card | well under 1 GB; ~0.25 CU only while in use | compute suspends until next month if 100 CU-h is used up |
| Cloudflare Workers Free | 100,000 requests/day | a few hundred | requests fail (error 1027) |

Sources: cloud.google.com/run/pricing, cloud.google.com/build/pricing, cloud.google.com/artifact-registry/pricing, cloud.google.com/secret-manager/pricing, neon.com/pricing, developers.cloudflare.com/workers/platform/limits. The one-time setup below includes a $1 budget alert, so any charge shows up quickly.

### One-time setup

You run these steps yourself (they need your accounts and credentials). Run them from a checkout of this repo. Pick a globally unique project id and keep the same shell open: later steps reuse `$GCP_PROJECT`.

**1. Neon** (console at https://console.neon.tech, no card needed)

1. Sign up, then **New project**: name `workout-tracker`, **Postgres version 16**, region **AWS US East 1 (N. Virginia)**. The defaults are fine for the database name (`neondb`) and role (`neondb_owner`).
2. Under **Connect**, copy two connection strings:
   - the **pooled** one (host contains `-pooler`). The app uses this one.
   - the **direct** one (turn "Connection pooling" off). Only the data migration uses it.

   Keep both somewhere private; they contain the password.

**2. Google Cloud project** (gcloud is already installed on this PC)

```bash
export GCP_PROJECT=workout-tracker-XXXX        # pick a unique id
export REGION=us-east4

gcloud auth login                               # if needed
gcloud projects create "$GCP_PROJECT" --name="Workout Tracker"
gcloud billing accounts list                    # note the ACCOUNT_ID
gcloud billing projects link "$GCP_PROJECT" --billing-account=ACCOUNT_ID

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com \
  billingbudgets.googleapis.com --project="$GCP_PROJECT"

# Budget alert: emails at 50% and 100% of $1
gcloud billing budgets create --billing-account=ACCOUNT_ID \
  --display-name="workout-tracker" --budget-amount=1USD \
  --threshold-rule=percent=0.5 --threshold-rule=percent=1.0 \
  --filter-projects="projects/$GCP_PROJECT"
```

The scripts pass `--project` explicitly, so your gcloud default project (currently another project) doesn't need to change.

**3. Store the pooled Neon URL in Secret Manager and let Cloud Run read it**

```bash
read -rs NEON_POOLED_URL      # paste the pooled connection string, then Enter
printf '%s' "$NEON_POOLED_URL" | gcloud secrets create database-url \
  --data-file=- --replication-policy=automatic --project="$GCP_PROJECT"

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT" --format='value(projectNumber)')"
gcloud secrets add-iam-policy-binding database-url --project="$GCP_PROJECT" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

If the URL ever changes (e.g. after a password reset), add a new version with `printf '%s' "$NEW_URL" | gcloud secrets versions add database-url --data-file=- --project="$GCP_PROJECT"`. Then destroy the old version (`gcloud secrets versions destroy 1 --secret=database-url --project="$GCP_PROJECT"`) and redeploy.

**4. First deploy, against an empty Neon database**

The data migration comes later, at cutover. A first deploy now creates the service and its URL:

```bash
scripts/deploy-cloudrun.sh
```

The deploy itself succeeds, but the script's final check (`/api/users`) fails because the database has no tables yet. That's expected at this point. If Cloud Build fails with a permissions error, grant the build role and run the script again:

```bash
gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role=roles/run.builder
```

**5. Keep Artifact Registry under the free 0.5 GB**

Each `--source` deploy pushes a new image to the `cloud-run-source-deploy` repository, which the first deploy creates. This policy keeps the 3 newest images and deletes the rest:

```bash
gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy \
  --project="$GCP_PROJECT" --location="$REGION" \
  --policy=deploy/artifact-registry-cleanup.json --no-dry-run
```

**6. Cloudflare Worker** (dashboard at https://dash.cloudflare.com; you can also create it now and add its route at cutover)

1. Get the service URL: `gcloud run services describe workout-tracker --project="$GCP_PROJECT" --region="$REGION" --format='value(status.url)'`
2. **Workers & Pages → Create → Create Worker** (start from "Hello World"), name it `workout-tracker-proxy`, and Deploy.
3. **Edit code**: replace the code with `deploy/cloudflare-worker.js`, then Deploy.
4. **Settings → Variables and Secrets → Add**, type Text: name `RUN_HOST`, value the URL's host without `https://`, e.g. `workout-tracker-abc123-uk.a.run.app`. Deploy.
5. Don't add the route yet; that is the cutover switch.

### Routine deploys

```bash
export GCP_PROJECT=workout-tracker-XXXX
scripts/deploy-cloudrun.sh [migration.sql ...]
```

The script checks the checkout is on a clean `main` and fast-forwards it to `origin/main`. It then applies any listed migrations to Neon, using the URL from Secret Manager (`server/src/migrate.ts`, one transaction per file). Finally it builds and deploys with Cloud Build and checks `/`, `/api/users` and `/api/users/<id>/exercise-stats` on the new revision. It needs gcloud, git and node/npm, but no Docker.

List only migrations added since the last deploy. They are idempotent, so re-running one is harmless.

To run a migration by hand:

```bash
cd server && npm ci
DATABASE_URL="$(gcloud secrets versions access latest --secret=database-url --project="$GCP_PROJECT")" \
  npx tsx src/migrate.ts add_something.sql
```

### Rolling back a deploy

- **Code:** in the Cloud Run console (service → Revisions → Manage traffic), send 100% to the previous revision, or run:
  ```bash
  gcloud run revisions list --service=workout-tracker --project="$GCP_PROJECT" --region="$REGION"
  gcloud run services update-traffic workout-tracker --to-revisions=REVISION=100 --project="$GCP_PROJECT" --region="$REGION"
  ```
  Traffic stays pinned to that revision until you run `gcloud run services update-traffic workout-tracker --to-latest ...`. The deploy script doesn't undo the pin, so run it before the next deploy.
- **Data:** Neon keeps a 6-hour restore window on the Free plan. In the Neon console, open **Backup & Restore**, restore the `main` branch to a time before the bad migration, and check the restore preview first.

## Moving production off the PC

Do this once, when you have about 30 minutes. The site is down from step 1 until the Worker route goes live in step 4, usually about 10 minutes. The local database is only read and stays intact for rollback.

Before you start: finish the [one-time setup](#one-time-setup), make sure Docker is running on this PC, and have the **direct** Neon URL ready.

### 1. Stop writes to the old database

```bash
cd ~/dev/workout-tracker
docker compose stop tunnel app        # db keeps running; the site is now down
```

### 2. Copy the data into Neon and verify it

```bash
read -rs NEON_DIRECT_URL && export NEON_DIRECT_URL     # paste the DIRECT (non-pooler) URL
scripts/migrate-data-to-neon.sh
```

The script:

1. Refuses to run unless the Neon database is empty.
2. Runs `pg_dump --no-owner --no-privileges` on the local `db` (read-only) into `backup/backup-pre-neon-<timestamp>.sql`.
3. Restores the dump into Neon in one transaction.
4. Compares every table's row count and every sequence's value between the two databases, and fails if anything differs.

It ends with `Neon matches the local database` and a table of counts. The dump isn't git-ignored: commit it if you want it kept with your other dumps (`git add backup/backup-pre-neon-*.sql`).

To redo it (e.g. after a rehearsal), empty Neon first:

```bash
docker run --rm -i postgres:16-alpine psql "$NEON_DIRECT_URL" -v ON_ERROR_STOP=1 \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
```

### 3. Check the app on its run.app URL

```bash
export GCP_PROJECT=workout-tracker-XXXX REGION=us-east4
URL="$(gcloud run services describe workout-tracker --project="$GCP_PROJECT" --region="$REGION" --format='value(status.url)')"
curl -fsS "$URL/api/users"            # should list your user
```

Open `$URL` in a browser: history, plans and settings should look exactly as before. If anything is missing, see [Rollback](#rollback).

### 4. Point workout.themokes.org at Cloud Run

In Cloudflare: **Workers & Pages → workout-tracker-proxy → Settings → Domains & Routes → Add → Route**, with zone `themokes.org`, route `workout.themokes.org/*`, and failure mode "Fail closed".

The tunnel's proxied DNS record for `workout` stays as it is. A Worker route runs before the origin, so requests now go to Cloud Run.

### 5. Check it

```bash
curl -sI https://workout.themokes.org/ | head -5        # HTTP/2 200
curl -fsS https://workout.themokes.org/api/users         # your user
```

Then use the app on your phone: open today's workout, log a set, reload, and confirm the set is still there. Checking from a terminal:

```bash
gcloud run services logs read workout-tracker --project="$GCP_PROJECT" --region="$REGION" --limit=20
```

### 6. Stop the local stack

Once you're happy (waiting a day or so is reasonable):

```bash
cd ~/dev/workout-tracker
docker compose stop db                 # keep the containers and the pgdata volume for now
```

Docker no longer has to run for the site to work. To stop Docker starting with Windows, turn off "Start Docker Desktop when you sign in" in Docker Desktop → Settings → General.

### 7. Decommission later (after a week or two of no problems)

1. Cloudflare DNS: point the `workout` record at the Worker on its own. Edit the record to type `AAAA`, content `100::`, Proxied on. The address is a placeholder, since the Worker route answers every request. Only then delete the tunnel in **Zero Trust → Networks → Tunnels**: deleting it first can remove the DNS record, and the Worker route would stop matching.
2. Remove the old containers but keep the data volume as a last-resort copy: `docker compose down` (**never** add `-v`). The final dump in `backup/` is a second copy.
3. Remove `TUNNEL_TOKEN` from `~/dev/workout-tracker/.env`.

### Rollback

Until step 7, you can go back to the PC in two steps:

1. Cloudflare: **Workers & Pages → workout-tracker-proxy → Settings → Domains & Routes**. Delete the `workout.themokes.org/*` route. Traffic goes back to the tunnel immediately.
2. Restart the local stack:
   ```bash
   cd ~/dev/workout-tracker
   docker compose up -d db app tunnel
   curl -fsS http://localhost:7000/api/users
   ```

Anything logged on Cloud Run after cutover exists only in Neon. To keep it, copy Neon back into the local database before restarting `app`. This replaces the local data:

```bash
cd ~/dev/workout-tracker
docker compose up -d db
docker run --rm postgres:16-alpine pg_dump --no-owner --no-privileges "$NEON_DIRECT_URL" > backup/backup-from-neon-$(date +%Y%m%d-%H%M%S).sql
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backup/backup-from-neon-<timestamp>.sql
docker compose up -d app tunnel
```

## Local Docker Compose stack (old production and rollback target)

Until the cutover, production ran on the home machine as the Docker Compose project `workout-tracker`, started from the checkout at `~/dev/workout-tracker` (`docker-compose.yml`). It still works for local development and for rollback:

| Service | What it is |
|---------|------------|
| `db` | `postgres:16-alpine`, data in the `workout-tracker_pgdata` volume, host port 5432 |
| `app` | Image built from the root `Dockerfile` (client + server), host port 7000 → 3001 |
| `tunnel` | `cloudflared`, runs in the app container's network (`network_mode: service:app`) |

The app image is built from the files in the checkout, so deploying means updating the checkout and then rebuilding `app`. The image does **not** contain `server/migrations/`; migrations are piped into the `db` container with `psql`.

Because `tunnel` shares the app container's network, it must be recreated whenever `app` is recreated.

### Deploying (local stack)

From the deploy checkout:

```bash
cd ~/dev/workout-tracker
scripts/deploy.sh [migration.sql ...]
```

The script:

1. Checks the checkout is on `main` with no uncommitted changes and that `db` is running.
2. Backs up the database with `pg_dump` to `backup/backup-pre-deploy-<timestamp>.sql` (git-ignored) and records the `sets` row count.
3. Fast-forwards to `origin/main` (`git merge --ff-only`).
4. Applies each listed migration from `server/migrations/` in a single transaction (`psql -1`, stopping on error).
5. Rebuilds and restarts only `app` (`docker compose up -d --build --no-deps app`), then recreates `tunnel`.
6. Checks that `http://localhost:7000/` and `/api/users/<id>/exercise-stats` respond, and that the `sets` row count did not change.

List only the migrations added since the last deploy. They are written to be idempotent, so re-running one is harmless.

### Rolling back (local stack)

```bash
# Code: go back to the previous commit and rebuild
git -C ~/dev/workout-tracker log --oneline -5
git -C ~/dev/workout-tracker reset --hard <previous-commit>
docker compose up -d --build --no-deps app && docker compose up -d --no-deps --force-recreate tunnel

# Data (only if a migration damaged it): restore the pre-deploy dump
docker compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backup/backup-pre-deploy-<timestamp>.sql
```

Additive migrations (new nullable columns) don't need a data rollback: the previous app version ignores the extra columns.

## Other hosting options

Generic instructions for running the app elsewhere.

## Prerequisites

- **Node.js**: 18 or higher
- **PostgreSQL**: 16 (or compatible version)
- **npm**: Comes with Node.js

---

## Option 1: Shared Hosting (No Docker)

This method runs the application directly on your hosting environment. The Express server serves both the API and the React frontend from a single process.

### Step 1: Upload Files

Upload the project to your hosting. You can exclude:
- `node_modules/` (will be installed on server)
- `client/dist/` (will be built on server)
- `server/dist/` (will be built on server)

### Step 2: Install Dependencies

```bash
npm run install:all
```

Or manually:
```bash
cd client && npm install
cd ../server && npm install
```

### Step 3: Configure Environment

Create the environment file:
```bash
cp .env.example server/.env
```

Edit `server/.env` with your database credentials:
```env
DB_HOST=localhost          # Your PostgreSQL host
DB_PORT=5432               # PostgreSQL port
DB_USER=your_db_user       # Database username
DB_PASSWORD=your_password  # Database password
DB_NAME=workout_tracker    # Database name
PORT=3001                  # Port for the app (check what your host allows)
NODE_ENV=production
```

### Step 4: Create Database

Using your hosting's database management tool (phpPgAdmin, command line, etc.):

```sql
CREATE DATABASE workout_tracker;
```

Or if your host provides a database, just use those credentials in your `.env`.

### Step 5: Build the Application

```bash
npm run build
```

This compiles both the React frontend and Express backend.

### Step 6: Initialize Database Schema

```bash
npm run seed
```

This creates all tables and seeds initial data. **Only run this once** - it will drop existing tables.

### Step 7: Start the Application

#### Using PM2 (Recommended)

PM2 keeps your app running and restarts it if it crashes:

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js --env production

# Save the process list (auto-start on reboot)
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status              # Check app status
pm2 logs workout-tracker # View logs
pm2 restart workout-tracker # Restart app
pm2 stop workout-tracker    # Stop app
```

#### Without PM2

```bash
npm run start
```

Note: Without PM2, the app stops if you close the terminal or if it crashes.

### Step 8: Configure Reverse Proxy (If Needed)

If your host uses Apache or Nginx, you may need to proxy requests to your Node app.

**Nginx example** (add to your site config):
```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**Apache example** (.htaccess or virtual host):
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3001/$1 [P,L]
```

---

## Option 2: Docker Deployment

This method uses Docker Compose to run the application and database in containers.

### Step 1: Install Docker

Make sure Docker and Docker Compose are installed on your server.

### Step 2: Configure Environment (Optional)

For custom database credentials, create a `.env` file in the project root:

```env
DB_USER=myuser
DB_PASSWORD=mysecurepassword
DB_NAME=workout_tracker
PORT=3001
```

Or use the defaults (user: `workout`, password: `workout`).

### Step 3: Build and Start

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Initialize Database

After the containers are running, seed the database:

```bash
docker-compose exec app node dist/seed.js
```

### Step 5: Access the Application

The app is available at `http://your-server:3001`

### Managing the Docker Deployment

```bash
# Stop the application
docker-compose down

# Stop and remove data (fresh start)
docker-compose down -v

# Restart
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

---

## Updating the Application

### Shared Hosting

```bash
# Pull latest code (if using git)
git pull

# Rebuild
npm run build

# Restart
pm2 restart workout-tracker
```

### Docker

```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

---

## Troubleshooting

### Application won't start

1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify database is running and credentials are correct
3. Ensure port is not in use: `lsof -i :3001`

### Database connection errors

1. Verify PostgreSQL is running
2. Check credentials in `.env` match your database
3. Ensure database exists: `psql -l` to list databases
4. Check if your host allows connections (some restrict to localhost)

### "Port already in use"

```bash
# Find what's using the port
lsof -i :3001

# Kill the process or use a different port in .env
```

### Blank page / 404 errors

1. Ensure you ran `npm run build`
2. Check that `client/dist/` exists and has files
3. Verify `NODE_ENV=production` is set

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | Full connection string (Neon on Cloud Run). Takes precedence over `DB_*`; TLS verified unless `sslmode=disable`/`no-verify` |
| `DB_POOL_MAX` | 5 | Maximum database connections per instance |
| `DB_HOST` | localhost | PostgreSQL hostname |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | workout | Database username |
| `DB_PASSWORD` | workout | Database password |
| `DB_NAME` | workout_tracker | Database name |
| `PORT` | 3001 | Application port (Cloud Run sets 8080) |
| `TZ` | - | Server timezone; `America/New_York` in production (used for the default workout date) |
| `NODE_ENV` | - | Set to `production` for production builds |
