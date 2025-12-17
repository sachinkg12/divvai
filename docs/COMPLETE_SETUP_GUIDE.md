# Complete Setup Guide - Divvai

This guide walks you through setting up the entire Divvai application from scratch, including all prerequisites.

## Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Prerequisites Overview](#prerequisites-overview)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Verification Steps](#verification-steps)
5. [Troubleshooting](#troubleshooting)

---

## Understanding the Architecture

Divvai consists of **two separate servers** that work together:

1. **Frontend Server (Port 3000)**: Next.js web application
   - What you see in the browser
   - Handles user interface and authentication
   - Makes API calls to the backend

2. **Backend Server (Port 4000)**: NestJS API server
   - Handles all business logic
   - Connects to the database
   - Verifies authentication tokens
   - Processes requests (create groups, expenses, etc.)

**Why two servers?**
- Frontend (3000): Serves the React/Next.js application
- Backend (4000): Provides REST API endpoints that the frontend calls

When you click "Create Group" in the browser:
1. Frontend (port 3000) sends a request to Backend (port 4000)
2. Backend processes the request and saves to database
3. Backend sends response back to Frontend
4. Frontend updates the UI

---

## Prerequisites Overview

Before starting, you need:

1. **Node.js 18+** and **npm 9+** - JavaScript runtime and package manager
2. **PostgreSQL 14+** - Database to store all data
3. **Google Cloud Project** - For Firebase Authentication
4. **Firebase Service Account Key** - For backend authentication verification

---

## Step-by-Step Setup

### Step 1: Install Node.js and npm

**Check if you have them:**
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

**If not installed:**

- **macOS**: 
  ```bash
  # Using Homebrew
  brew install node@18
  
  # Or download from https://nodejs.org/
  ```

- **Windows**: Download installer from https://nodejs.org/
- **Linux**: 
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

**Verify installation:**
```bash
node --version
npm --version
```

---

### Step 2: Set Up PostgreSQL Database

You need a PostgreSQL database running. Choose one option:

#### Option A: Using Docker (Recommended - Easiest)

**First, check if port 5432 is already in use:**
```bash
# Check what's using port 5432
lsof -i :5432
# Or on Linux
sudo netstat -tulpn | grep 5432
```

**If port 5432 is already in use, you have two choices:**

**Choice 1: Use the existing PostgreSQL (Recommended)**
- If you see PostgreSQL already running, you can use it!
- Skip Docker setup and go to **Option B** below
- Just create the database: `createdb divvai`

**Choice 2: Stop existing PostgreSQL and use Docker**
```bash
# If it's a Docker container
docker ps
docker stop <container-name>

# If it's a local PostgreSQL service
# macOS
brew services stop postgresql@14
# or
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Windows: Stop PostgreSQL service from Services panel
```

**Install Docker Desktop:**
- Download from https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

**Start PostgreSQL container:**
```bash
docker run --name divvai-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=divvai \
  -p 5432:5432 \
  -d postgres:14
```

**Verify it's running:**
```bash
docker ps
# Should show divvai-postgres container
```

**To stop it later:**
```bash
docker stop divvai-postgres
```

**To start it again:**
```bash
docker start divvai-postgres
```

#### Option B: Use Existing PostgreSQL Installation

**If you already have PostgreSQL running (port 5432 in use):**

1. **Verify PostgreSQL is running:**
   ```bash
   # Check if PostgreSQL is accessible
   psql --version
   pg_isready
   ```

2. **Create the database:**
   ```bash
   createdb divvai
   ```
   
   **If you get "permission denied":**
   ```bash
   # Try with postgres user
   psql -U postgres -c "CREATE DATABASE divvai;"
   
   # Or if you have a different username
   psql -U your-username -c "CREATE DATABASE divvai;"
   ```

3. **Note your PostgreSQL connection details:**
   - Username: (usually `postgres` or your system username)
   - Password: (if you set one, or empty)
   - Port: (usually `5432`)
   - Host: (usually `localhost`)

   **You'll need these for the DATABASE_URL in Step 6.1**

#### Option C: Install PostgreSQL Locally (If Not Already Installed)

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb divvai
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install PostgreSQL 14
- During installation, set password to `postgres` (or remember your password)
- Create database: Open pgAdmin or run `createdb divvai` in command prompt

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-14
sudo systemctl start postgresql
sudo -u postgres createdb divvai
```

**Verify PostgreSQL is running:**
```bash
# Check if PostgreSQL is accessible
psql -U postgres -d divvai -c "SELECT version();"
# Or
pg_isready
```

---

### Step 3: Set Up Firebase / Google Cloud Identity Platform

#### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `divvai` (or your choice)
4. Click "Create"
5. Wait for project creation (30-60 seconds)

#### 3.2 Enable Identity Platform

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Identity Platform API"
3. Click on it and click **Enable**
4. Wait for it to enable (may take a minute)

**Alternative method:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select your existing project
3. If prompted, enable Google Analytics (optional)
4. Click "Continue" → "Create project"
5. Wait for project creation
6. Go to **Authentication** → **Get Started**
7. This automatically enables Identity Platform

#### 3.3 Configure Google Sign-In

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Select a **Project support email** (your email)
5. Click **Save**

#### 3.4 Configure GitHub Sign-In (Optional but Recommended)

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **GitHub**
3. Toggle **Enable** to ON
4. You need to create a GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - Click **New OAuth App**
   - **Application name**: Divvai
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000`
   - Click **Register application**
   - Copy the **Client ID** and **Client Secret**
5. Back in Firebase, paste the **Client ID** and **Client Secret**
6. Click **Save**

#### 3.5 Add Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Ensure `localhost` is in the list (usually added automatically)
3. If not, click **Add domain** → Enter `localhost` → **Add**

#### 3.6 Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon) → **General** tab
2. Scroll to **Your apps** section
3. If you don't have a web app:
   - Click **Add app** → **Web** (</> icon)
   - Register app name: `Divvai Web`
   - You can skip Firebase Hosting setup
   - Click **Register app**
4. Copy these values (you'll need them later):
   - **API Key**: `AIza...` (long string)
   - **Auth Domain**: `your-project.firebaseapp.com`
   - **Project ID**: `your-project-id`

#### 3.7 Create Service Account Key (for Backend)

1. In Firebase Console, go to **Project Settings** → **Service Accounts** tab
2. Click **Generate new private key**
3. Click **Generate key** in the popup
4. A JSON file will download - **save this file!**
5. Rename it to `service-account-key.json`
6. Move it to `apps/api/service-account-key.json` in your project

---

### Step 4: Install Project Dependencies

**Navigate to project root:**
```bash
cd /path/to/divvai
```

**Install all dependencies:**
```bash
npm install
```

This installs dependencies for:
- Root workspace
- Frontend (apps/web)
- Backend (apps/api)
- Shared package (packages/shared)

**Expected output:**
- May take 2-5 minutes
- Should complete without errors
- If you see errors, check Node.js version (must be 18+)

---

### Step 5: Build Shared Package

The shared package contains TypeScript types used by both frontend and backend.

```bash
cd packages/shared
npm run build
cd ../..
```

**Expected output:**
```
[timestamp] Found 0 errors. Watching for file changes.
```

---

### Step 6: Set Up Backend (API Server - Port 4000)

#### 6.1 Create Backend Environment File

Create `apps/api/.env`:

**If using Docker PostgreSQL (default password):**
```bash
cd apps/api
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/divvai?schema=public
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF
```

**If using existing PostgreSQL (adjust username/password):**
```bash
cd apps/api
cat > .env << 'EOF'
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/divvai?schema=public
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF
```

**Important:** 
- Replace `YOUR_USERNAME` with your PostgreSQL username (often `postgres` or your system username)
- Replace `YOUR_PASSWORD` with your PostgreSQL password (leave empty if no password: `postgresql://postgres@localhost:5432/divvai`)
- Replace `your-project-id-here` with your actual Firebase Project ID from Step 3.6

**Common DATABASE_URL formats:**
- With password: `postgresql://postgres:postgres@localhost:5432/divvai?schema=public`
- Without password: `postgresql://postgres@localhost:5432/divvai?schema=public`
- Different user: `postgresql://myuser:mypassword@localhost:5432/divvai?schema=public`

#### 6.2 Generate Prisma Client

Prisma is the database ORM. You need to generate the client:

```bash
# Still in apps/api directory
npm run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client (version X.X.X) to ./node_modules/@prisma/client
```

#### 6.3 Run Database Migrations

This creates all the database tables:

```bash
npm run db:migrate
```

**First time will ask for a migration name:**
- Just press Enter or type: `init`

**Expected output:**
```
✔ The following migration(s) have been created and applied:
  MigrationName
```

**If you see errors:**
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify DATABASE_URL in `.env` is correct (especially username/password)
- Check database exists: `psql -U postgres -l` (should see `divvai`)
- Test connection: `psql -U YOUR_USERNAME -d divvai -c "SELECT 1;"`

#### 6.4 Verify Service Account Key

Make sure `service-account-key.json` exists:

```bash
ls -la service-account-key.json
```

**If missing:**
- Go back to Step 3.7
- Download the service account key
- Place it in `apps/api/service-account-key.json`

```bash
cd ../..
```

---

### Step 7: Set Up Frontend (Web Server - Port 3000)

#### 7.1 Create Frontend Environment File

Create `apps/web/.env.local`:

```bash
cd apps/web
cat > .env.local << 'EOF'
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

**Important:** Replace with your actual values from Step 3.6:
- `your-api-key-here` → Your Firebase API Key
- `your-project.firebaseapp.com` → Your Auth Domain
- `your-project-id` → Your Project ID

```bash
cd ../..
```

---

### Step 8: Start Both Servers

**From the project root directory:**

```bash
npm run dev
```

**What this does:**
- Starts Frontend server on http://localhost:3000
- Starts Backend API server on http://localhost:4000
- Watches for file changes and auto-reloads

**Expected terminal output:**
```
@divvai/shared:dev: [timestamp] Found 0 errors. Watching for file changes.

@divvai/web:dev:   ▲ Next.js 14.2.35
@divvai/web:dev:   - Local:        http://localhost:3000
@divvai/web:dev:   ✓ Ready in XXXXms

@divvai/api:dev: [timestamp] Starting compilation in watch mode...
@divvai/api:dev: [timestamp] Found 0 errors. Watching for file changes.
@divvai/api:dev: 🚀 API server running on http://localhost:4000
```

**Keep this terminal open!** Both servers need to keep running.

---

## Verification Steps

### 1. Verify Backend API (Port 4000)

Open in browser: http://localhost:4000/health

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

**If you see "Connection refused":**
- Check terminal for errors
- Verify `.env` file exists in `apps/api/`
- Check PostgreSQL is running
- See [Troubleshooting](#troubleshooting) section

### 2. Verify Frontend (Port 3000)

Open in browser: http://localhost:3000

**Expected:**
- Login page with "Continue with Google" and "Continue with GitHub" buttons
- No error messages in browser console

**If you see configuration error:**
- Check `.env.local` exists in `apps/web/`
- Verify all Firebase values are correct
- Restart the dev server after creating `.env.local`

### 3. Test Authentication

1. Click "Continue with Google"
2. Complete Google sign-in
3. Should redirect to dashboard

**If authentication fails:**
- Check Identity Platform is enabled (Step 3.2)
- Verify Google sign-in is enabled (Step 3.3)
- Check `localhost` is in authorized domains (Step 3.5)

### 4. Test Creating a Group

1. After logging in, click "Create Group"
2. Enter group name: "Test Group"
3. Click "Create Group"
4. Should redirect to group page

**If creation fails:**
- Check backend is running (http://localhost:4000/health)
- Check browser console for errors
- Verify database migrations ran successfully

---

## Troubleshooting

### Port 5432 Already in Use

**Error: "address already in use" or "ports are not available"**

This means PostgreSQL is already running. You have two options:

**Option 1: Use the existing PostgreSQL (Recommended)**
```bash
# Check what's using the port
lsof -i :5432

# If it's PostgreSQL, just use it!
# Create the database
createdb divvai
# Or if you need a different user
psql -U postgres -c "CREATE DATABASE divvai;"

# Then update DATABASE_URL in apps/api/.env to match your setup
# See Step 6.1 for DATABASE_URL format
```

**Option 2: Stop existing PostgreSQL and use Docker**
```bash
# Find what's using port 5432
lsof -i :5432

# If it's a Docker container
docker ps
docker stop <container-name>

# If it's a local PostgreSQL service
# macOS
brew services stop postgresql@14
# or
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Windows: Stop PostgreSQL service from Services panel
# Then start Docker container
docker start divvai-postgres
```

**Option 3: Use a different port for Docker**
```bash
# Use port 5433 instead
docker run --name divvai-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=divvai \
  -p 5433:5432 \
  -d postgres:14

# Then update DATABASE_URL to use port 5433
# postgresql://postgres:postgres@localhost:5433/divvai?schema=public
```

### Backend (Port 4000) Not Starting

**Error: "Cannot find module '@prisma/client'"**
```bash
cd apps/api
npm run db:generate
cd ../..
```

**Error: "Can't reach database server"**
- Check PostgreSQL is running:
  ```bash
  docker ps  # If using Docker
  pg_isready  # If installed locally
  ```
- Verify DATABASE_URL in `apps/api/.env` is correct
  - Check username matches your PostgreSQL user
  - Check password is correct (or remove if no password)
  - Check database name is `divvai`
- Test connection manually:
  ```bash
  psql -U YOUR_USERNAME -d divvai -c "SELECT 1;"
  ```

**Error: "Table 'users' does not exist"**
```bash
cd apps/api
npm run db:migrate
cd ../..
```

**Error: "Firebase Admin not initialized"**
- Verify `service-account-key.json` exists in `apps/api/`
- Check `FIREBASE_PROJECT_ID` in `.env` matches your project
- This is a warning - API will still work, but auth won't

**Error: "password authentication failed"**
- Check your DATABASE_URL password matches your PostgreSQL password
- Try connecting manually: `psql -U postgres -d divvai`
- If no password, use: `postgresql://postgres@localhost:5432/divvai`

### Frontend (Port 3000) Not Starting

**Error: "Firebase configuration missing"**
- Create `apps/web/.env.local` (see Step 7.1)
- Restart dev server after creating file

**Error: "auth/configuration-not-found"**
- Enable Identity Platform (Step 3.2)
- Enable Google sign-in (Step 3.3)

**Error: "auth/unauthorized-domain"**
- Add `localhost` to authorized domains (Step 3.5)

### Database Issues

**PostgreSQL not running:**
```bash
# Docker
docker start divvai-postgres

# Homebrew (macOS)
brew services start postgresql@14

# System service (Linux)
sudo systemctl start postgresql
```

**Can't connect to database:**
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Verify password is correct
- Check PostgreSQL is listening on correct port
- Test connection: `psql -U YOUR_USERNAME -d divvai`

**Migration errors:**
- Make sure database exists: `createdb divvai` or `psql -U postgres -c "CREATE DATABASE divvai;"`
- Check you have permissions: `psql -U postgres -d divvai`
- Verify DATABASE_URL is correct in `.env`

**"Database does not exist" error:**
```bash
# Create the database
createdb divvai
# Or
psql -U postgres -c "CREATE DATABASE divvai;"
```

### Port Already in Use

**Port 4000 in use:**
```bash
# Find what's using it
lsof -i :4000

# Kill the process or change PORT in apps/api/.env
```

**Port 3000 in use:**
```bash
# Find what's using it
lsof -i :3000

# Kill the process
```

---

## Quick Reference

### Start Everything
```bash
# From project root
npm run dev
```

### Stop Everything
- Press `Ctrl+C` in the terminal running `npm run dev`

### Restart After Changes
1. Stop servers (`Ctrl+C`)
2. Make your changes
3. Start again: `npm run dev`

### Check What's Running
```bash
# Check ports
lsof -i :3000  # Frontend
lsof -i :4000  # Backend
lsof -i :5432  # PostgreSQL
```

### Common Commands
```bash
# Database migrations
cd apps/api && npm run db:migrate

# Generate Prisma client
cd apps/api && npm run db:generate

# View database (optional)
cd apps/api && npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Test Database Connection
```bash
# Test if you can connect
psql -U YOUR_USERNAME -d divvai -c "SELECT version();"

# List all databases
psql -U postgres -l

# Connect to database interactively
psql -U YOUR_USERNAME -d divvai
```

---

## Next Steps

Once everything is running:

1. ✅ Both servers running (ports 3000 and 4000)
2. ✅ Can access http://localhost:3000
3. ✅ Can access http://localhost:4000/health
4. ✅ Can sign in with Google
5. ✅ Can create a group

You're ready to use Divvai! 🎉

For more information:
- [Auth Flow Documentation](./auth-flow.md)
- [API Troubleshooting](./api-troubleshooting.md)
- [Firebase Setup](./firebase-setup.md)
