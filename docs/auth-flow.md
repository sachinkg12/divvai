# Authentication Flow

## Overview

Divvai uses Google Cloud Identity Platform (Firebase Auth) for authentication with support for Google and GitHub OAuth providers.

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User clicks "Sign in with Google/GitHub"
       │
       ▼
┌─────────────────────┐
│  Firebase Auth SDK  │
│  (Web Client)       │
└──────┬──────────────┘
       │
       │ 2. OAuth flow (redirect/popup)
       │
       ▼
┌─────────────────────┐
│ Identity Platform   │
│ (Google Cloud)      │
└──────┬──────────────┘
       │
       │ 3. Returns ID token
       │
       ▼
┌─────────────────────┐
│  Next.js Frontend  │
└──────┬──────────────┘
       │
       │ 4. Store token, make API calls
       │    Authorization: Bearer <id-token>
       │
       ▼
┌─────────────────────┐
│  NestJS API         │
│  (Cloud Run)        │
└──────┬──────────────┘
       │
       │ 5. Verify token with Firebase Admin
       │
       ▼
┌─────────────────────┐
│  Firebase Admin SDK │
│  (Backend)          │
└──────┬──────────────┘
       │
       │ 6. Token verified, decode user info
       │
       ▼
┌─────────────────────┐
│  User Provisioning  │
│  (Prisma/Postgres)  │
└─────────────────────┘
       │
       │ 7. Get or create user record
       │
       ▼
┌─────────────────────┐
│  Return User Profile │
└─────────────────────┘
```

## Detailed Flow

### 1. Frontend Authentication

**File**: `apps/web/src/lib/auth.ts`

```typescript
// User clicks "Sign in with Google"
signInWithGoogle() → Firebase Auth popup → Returns User with ID token
```

The Firebase Auth SDK handles:
- OAuth redirect/popup
- Token refresh
- Session management

### 2. API Request with Token

**File**: `apps/web/src/lib/api.ts`

```typescript
// Every API request includes the ID token
headers: {
  'Authorization': `Bearer ${idToken}`
}
```

### 3. Backend Token Verification

**File**: `apps/api/src/auth/auth.service.ts`

```typescript
// Verify token with Firebase Admin
const decodedToken = await admin.auth().verifyIdToken(token);

// Extract user info
{
  uid: string,
  email: string,
  name?: string,
  picture?: string,
  firebase: {
    sign_in_provider: 'google.com' | 'github.com'
  }
}
```

### 4. User Provisioning

**File**: `apps/api/src/auth/auth.service.ts`

On first login:
1. Check if user exists by `providerId` (Firebase UID) or `email`
2. If not found, create new user record in PostgreSQL
3. If found, update user info if needed
4. Return user object

### 5. Protected Routes

**File**: `apps/api/src/common/guards/auth.guard.ts`

All protected routes use `@UseGuards(AuthGuard)`:
- Extracts token from `Authorization` header
- Verifies token with Firebase Admin
- Attaches user to request object
- Throws `UnauthorizedException` if invalid

## Security Considerations

1. **Token Expiration**: Firebase ID tokens expire after 1 hour. The client SDK automatically refreshes tokens.

2. **Token Verification**: Always verify tokens on the backend. Never trust client-provided user IDs.

3. **CORS**: Configured to only allow requests from the frontend origin.

4. **Rate Limiting**: Implemented using `@nestjs/throttler` to prevent abuse.

5. **Error Handling**: Invalid tokens return 401 Unauthorized without exposing details.

## Environment Variables

### Frontend
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### Backend
```
FIREBASE_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
# OR use Application Default Credentials in Cloud Run
```

## Setup Instructions

1. **Enable Identity Platform** in Google Cloud Console
2. **Configure OAuth providers** (Google, GitHub)
3. **Create service account** for Firebase Admin SDK
4. **Download service account key** (for local dev) or use ADC (for Cloud Run)
5. **Set environment variables** in both frontend and backend

## Testing Authentication

1. Start frontend: `cd apps/web && npm run dev`
2. Start backend: `cd apps/api && npm run dev`
3. Navigate to `http://localhost:3000`
4. Click "Sign in with Google" or "Sign in with GitHub"
5. Complete OAuth flow
6. Verify user is created in database
7. Check API calls include `Authorization: Bearer <token>` header

