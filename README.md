# Workout Tracker

A full-stack workout tracking app with a 5-day rotating workout cycle. Log workouts, toggle exercises, view history, and manage settings.

**Tech stack:** React + TypeScript (frontend), Express + TypeScript (backend), PostgreSQL (database)

## Prerequisites

- Node.js 18+
- PostgreSQL 16 (or Docker)

## Getting Started

### Option 1: Local Development

1. **Install dependencies:**

   ```bash
   npm run install:all
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your PostgreSQL credentials:

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=workout
   DB_PASSWORD=workout
   DB_NAME=workout_tracker
   PORT=3001
   ```

3. **Create the database:**

   ```bash
   createdb workout_tracker
   ```

4. **Seed the database** (creates tables and initial data):

   ```bash
   npm run seed
   ```

5. **Run in development mode** (two terminals):

   ```bash
   # Terminal 1 - backend (watches for changes)
   npm run dev:server

   # Terminal 2 - frontend (Vite dev server on port 5173, proxies API to :3001)
   npm run dev:client
   ```

   Open http://localhost:5173

6. **Run in production mode:**

   ```bash
   npm run build
   npm run start
   ```

   Open http://localhost:3001

### Option 2: Docker

1. **Configure environment** (optional -- defaults work out of the box):

   ```bash
   cp .env.example .env
   ```

2. **Build and start:**

   ```bash
   npm run docker:build
   npm run docker:up
   ```

3. **Seed the database** (first run only):

   ```bash
   docker-compose exec app node dist/seed.js
   ```

4. **Access the app:**

   By default, the app is only accessible through a Cloudflare Tunnel. To access it locally, add a `ports` mapping to the `app` service in `docker-compose.yml`:

   ```yaml
   app:
     ports:
       - "3001:3001"
   ```

   Then open http://localhost:3001

### Docker Commands

```bash
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
npm run docker:build   # Rebuild images
npm run docker:logs    # View logs
```

## npm Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `install:all`      | Install client and server deps       |
| `build`            | Build client and server              |
| `build:client`     | Build React frontend                 |
| `build:server`     | Build Express backend                |
| `seed`             | Create tables and seed initial data  |
| `start`            | Start production server              |
| `dev:client`       | Start Vite dev server (port 5173)    |
| `dev:server`       | Start backend in watch mode          |

## Project Structure

```
workout-tracker/
├── client/          # React + TypeScript frontend (Vite)
│   └── src/
│       ├── components/
│       └── api.ts
├── server/          # Express + TypeScript backend
│   └── src/
│       ├── index.ts
│       ├── routes.ts
│       ├── db.ts
│       └── seed.ts
├── docker-compose.yml
├── Dockerfile
└── .env.example
```
