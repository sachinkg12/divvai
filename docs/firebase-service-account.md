# How to Get Firebase Service Account Key (GOOGLE_APPLICATION_CREDENTIALS)

The `GOOGLE_APPLICATION_CREDENTIALS` is the path to a JSON file that contains credentials for Firebase Admin SDK. This allows your backend API to verify authentication tokens.

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you haven't)

### Step 2: Navigate to Service Accounts

1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Select **Project Settings**
3. Click on the **Service Accounts** tab

### Step 3: Generate New Private Key

1. You'll see a section titled "Firebase Admin SDK"
2. Make sure **Node.js** is selected (it should be by default)
3. Click the button **"Generate new private key"**

### Step 4: Download the Key File

1. A popup will appear warning you about keeping the key secure
2. Click **"Generate key"** to confirm
3. A JSON file will automatically download to your computer
4. The file will be named something like: `your-project-id-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

### Step 5: Move and Rename the File

**Option A: Using Terminal (Recommended)**

1. Find where the file downloaded (usually `~/Downloads` on macOS/Linux)
2. Move it to your project:

```bash
# Navigate to your project
cd /path/to/divvai/apps/api

# Move and rename the file
mv ~/Downloads/your-project-id-firebase-adminsdk-*.json ./service-account-key.json
```

**Option B: Using File Manager**

1. Find the downloaded JSON file in your Downloads folder
2. Copy it
3. Navigate to `apps/api/` folder in your project
4. Paste it there
5. Rename it to `service-account-key.json`

### Step 6: Verify the File

Check that the file exists in the correct location:

```bash
cd apps/api
ls -la service-account-key.json
```

You should see the file listed.

### Step 7: Update .env File

Make sure your `apps/api/.env` file has:

```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

The `./` means "current directory" (which is `apps/api/`).

## What the File Contains

The JSON file looks something like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**⚠️ Security Warning:**
- **NEVER** commit this file to Git (it's already in `.gitignore`)
- **NEVER** share this file publicly
- **NEVER** include it in client-side code
- This file gives full admin access to your Firebase project

## Alternative: Using Environment Variable

Instead of a file path, you can also set the credentials as an environment variable, but for local development, using the file is simpler.

## Troubleshooting

### "File not found" error

**Check:**
1. File exists: `ls -la apps/api/service-account-key.json`
2. Path in `.env` is correct: `./service-account-key.json`
3. You're running the API from the `apps/api/` directory context

### "Invalid credentials" error

**Check:**
1. File is not corrupted (try downloading again)
2. File hasn't been modified
3. Project ID in the file matches your Firebase project

### "Permission denied" error

**Fix:**
```bash
# Make sure file is readable
chmod 600 apps/api/service-account-key.json
```

## For Production (Cloud Run)

When deploying to Google Cloud Run, you don't need this file! Cloud Run automatically provides credentials through "Application Default Credentials" (ADC). The backend code will automatically use ADC if the file doesn't exist.

For local development, you need the service account key file.

## Quick Checklist

- [ ] Downloaded JSON file from Firebase Console
- [ ] Moved file to `apps/api/service-account-key.json`
- [ ] Verified file exists: `ls apps/api/service-account-key.json`
- [ ] Updated `.env` with: `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json`
- [ ] File is NOT committed to Git (check `.gitignore`)

## Visual Guide

```
Firebase Console
  └─ Project Settings (⚙️)
      └─ Service Accounts tab
          └─ "Generate new private key" button
              └─ Downloads JSON file
                  └─ Move to: apps/api/service-account-key.json
                      └─ Reference in: apps/api/.env
```

That's it! Once the file is in place and referenced in your `.env`, the backend will be able to verify Firebase authentication tokens.

