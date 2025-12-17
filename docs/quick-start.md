# Quick Start Guide

## Local Development Setup

### 1. Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+ (or Docker)
- Google Cloud Project with Identity Platform enabled
- Firebase service account key (for local API development)

### 2. Clone and Install

```bash
# Install dependencies
npm install

# Build shared package
cd packages/shared
npm run build
cd ../..
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb divvai

# Or using Docker
docker run --name divvai-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=divvai \
  -p 5432:5432 \
  -d postgres:14

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/divvai?schema=public"

# Run migrations
cd apps/api
npm run db:migrate
cd ../..
```

### 4. Configure Environment Variables

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/divvai?schema=public
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 5. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save as `apps/api/service-account-key.json`

### 6. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:4000

### 7. Test the Application

1. Open http://localhost:3000
2. Click "Sign in with Google" or "Sign in with GitHub"
3. Complete OAuth flow
4. You should be redirected to the dashboard
5. Create a group
6. Add an expense
7. View balances

## Common Issues

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL is correct
echo $DATABASE_URL
```

### Firebase Admin Not Initialized

- Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to valid service account key
- Verify `FIREBASE_PROJECT_ID` matches your project

### CORS Errors

- Ensure `CORS_ORIGIN` in API matches frontend URL
- Check browser console for specific error messages

### Module Not Found Errors

```bash
# Rebuild shared package
cd packages/shared
npm run build
cd ../..

# Reinstall dependencies
npm install
```

## Next Steps

- Read [Auth Flow Documentation](./auth-flow.md)
- Review [Database Schema](./database-schema.md)
- Check [Deployment Guide](./deployment.md) for production setup

