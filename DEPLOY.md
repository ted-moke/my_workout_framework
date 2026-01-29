# Deployment Guide

This application can be deployed in two ways: using Docker (recommended for VPS/cloud) or directly on shared hosting without Docker.

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
| `DB_HOST` | localhost | PostgreSQL hostname |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | workout | Database username |
| `DB_PASSWORD` | workout | Database password |
| `DB_NAME` | workout_tracker | Database name |
| `PORT` | 3001 | Application port |
| `NODE_ENV` | - | Set to `production` for production builds |
