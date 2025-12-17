# Firebase / Identity Platform Setup Guide

## Step 1: Enable Identity Platform

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Identity Platform API"
5. Click **Enable**

Alternatively:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Select your project
- Go to **Authentication** → **Get Started**
- This will automatically enable Identity Platform

## Step 2: Configure OAuth Providers

### Google OAuth

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable**
4. Enter your **Project support email** (or use default)
5. Click **Save**

**Note**: Google OAuth works automatically - no additional credentials needed for basic setup.

### GitHub OAuth

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **GitHub**
3. Toggle **Enable**
4. You'll need to create a GitHub OAuth App:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click **New OAuth App**
   - **Application name**: Divvai (or your choice)
   - **Homepage URL**: `http://localhost:3000` (for dev) or your production URL
   - **Authorization callback URL**: 
     - For Firebase: `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
     - Or use: `http://localhost:3000` (for local testing)
   - Click **Register application**
   - Copy the **Client ID** and **Client Secret**
5. Back in Firebase, paste the **Client ID** and **Client Secret**
6. Click **Save**

## Step 3: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. Ensure these domains are listed:
   - `localhost` (for local development)
   - Your production domain (when deploying)
   - `YOUR-PROJECT-ID.firebaseapp.com` (usually added automatically)

## Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon) → **General** tab
2. Scroll to **Your apps** section
3. If you don't have a web app, click **Add app** → **Web** (</> icon)
4. Register your app (you can skip the hosting setup for now)
5. Copy the config values:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other values
   };
   ```

## Step 5: Update .env.local

Create or update `apps/web/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (from step 4)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Step 6: Restart Dev Server

After updating `.env.local`, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## Troubleshooting

### Error: "CONFIGURATION_NOT_FOUND"

This means Identity Platform is not enabled or configured:
- ✅ Enable Identity Platform API in Google Cloud Console
- ✅ Go to Firebase Console → Authentication → Get Started
- ✅ Ensure at least one sign-in method is enabled (Google or GitHub)

### Error: "auth/unauthorized-domain"

Add `localhost` to authorized domains:
- Firebase Console → Authentication → Settings → Authorized domains
- Click "Add domain" → Enter `localhost`

### Error: "auth/operation-not-allowed"

The sign-in method is not enabled:
- Firebase Console → Authentication → Sign-in method
- Enable the provider you're trying to use (Google/GitHub)

### GitHub OAuth Not Working

1. Verify callback URL matches exactly in GitHub OAuth App settings
2. For local development, you can use `http://localhost:3000` as callback URL
3. Ensure Client ID and Secret are correct in Firebase

## Testing

1. Open `http://localhost:3000`
2. Click "Continue with Google" or "Continue with GitHub"
3. Complete OAuth flow
4. You should be redirected to `/dashboard`

## Production Setup

When deploying to production:

1. Update authorized domains with your production domain
2. Update GitHub OAuth App callback URL to production URL
3. Update `.env.local` (or use environment variables in Cloud Run) with production values

