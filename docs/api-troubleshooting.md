# API Server Troubleshooting

## Issue: ERR_CONNECTION_REFUSED on localhost:4000

This means the NestJS API server is not running. Follow these steps:

### Step 1: Check if API is Running

Look at your terminal where you ran `npm run dev`. You should see:
```
@divvai/api:dev: 🚀 API server running on http://localhost:4000
```

If you don't see this message, the API failed to start.

### Step 2: Check for Startup Errors

Common errors that prevent the API from starting:

#### A. Missing DATABASE_URL

**Error**: `Can't reach database server` or Prisma errors

**Fix**: Create `apps/api/.env` file:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/divvai?schema=public
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### B. Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'` or similar

**Fix**: Generate Prisma client:
```bash
cd apps/api
npm run db:generate
cd ../..
```

#### C. Database Not Running

**Error**: `Can't reach database server at 'localhost:5432'`

**Fix**: Start PostgreSQL:

**Option 1: Using Docker**
```bash
docker run --name divvai-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=divvai \
  -p 5432:5432 \
  -d postgres:14
```

**Option 2: Using Homebrew (macOS)**
```bash
brew services start postgresql@14
createdb divvai
```

**Option 3: Using system service**
```bash
sudo systemctl start postgresql
createdb divvai
```

#### D. Database Migrations Not Run

**Error**: `Table "users" does not exist` or similar

**Fix**: Run migrations:
```bash
cd apps/api
npm run db:migrate
cd ../..
```

#### E. Firebase Admin Not Initialized

**Error**: `Firebase Admin not initialized` (warning, not fatal)

**Fix**: 
1. Download service account key from Firebase Console
2. Save as `apps/api/service-account-key.json`
3. Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

**Note**: For local development, you can skip Firebase Admin setup temporarily by commenting out the initialization check, but authentication won't work.

### Step 3: Verify API is Running

After fixing the issues, check:

1. **Terminal output**: Should show `🚀 API server running on http://localhost:4000`
2. **Test endpoint**: Open http://localhost:4000/health in browser
   - Should return: `{"status":"ok","timestamp":"..."}`

### Step 4: Quick Setup Checklist

Run these commands in order:

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Build shared package
cd packages/shared
npm run build
cd ../..

# 3. Generate Prisma client
cd apps/api
npm run db:generate

# 4. Create .env file (if not exists)
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/divvai?schema=public
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=your-project-id
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF

# 5. Run migrations (if database exists)
npm run db:migrate

cd ../..

# 6. Start dev servers
npm run dev
```

### Step 5: Manual API Start (for debugging)

If `npm run dev` doesn't work, try starting API manually:

```bash
cd apps/api
npm run dev
```

This will show you the exact error preventing startup.

### Common Solutions

#### Solution 1: Database Connection

If you don't have PostgreSQL set up yet, you can use a simple in-memory setup for testing (not recommended for production):

1. Install SQLite: `npm install --save-dev prisma-sqlite`
2. Update `prisma/schema.prisma` datasource to `sqlite`
3. Run migrations

**Note**: This is only for quick testing. Use PostgreSQL for real development.

#### Solution 2: Skip Firebase Admin (Temporary)

To test without Firebase Admin:

1. Comment out Firebase initialization in `apps/api/src/auth/auth.service.ts`
2. Modify `AuthGuard` to allow requests without token verification (for testing only)
3. **Warning**: This disables authentication - only for local testing!

#### Solution 3: Check Port Conflicts

If port 4000 is already in use:

```bash
# Check what's using port 4000
lsof -i :4000

# Kill the process or change PORT in .env
```

### Still Not Working?

1. Check terminal output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Try starting API manually: `cd apps/api && npm run dev`
5. Check Node.js version: `node --version` (should be 18+)

