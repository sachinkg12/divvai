# GCP Deployment Guide

## Prerequisites

1. Google Cloud Project with billing enabled
2. Cloud SQL PostgreSQL instance
3. Identity Platform enabled with OAuth providers configured
4. Service Account with Cloud Run Admin, Cloud Build, and Secret Manager permissions
5. Workload Identity Federation configured for GitHub Actions (optional, for CI/CD)

## Architecture

```
┌─────────────────┐
│  Cloud Run      │
│  (divvai-web)   │  ← Next.js Frontend
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼────────┐
│  Cloud Run      │
│  (divvai-api)   │  ← NestJS Backend
└────────┬────────┘
         │
         │ Private IP
         │
┌────────▼────────┐
│  Cloud SQL      │
│  (PostgreSQL)   │
└─────────────────┘
```

## Step 1: Set Up Cloud SQL

```bash
# Create Cloud SQL instance
gcloud sql instances create divvai-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default

# Create database
gcloud sql databases create divvai \
  --instance=divvai-db

# Create user
gcloud sql users create divvai-user \
  --instance=divvai-db \
  --password=YOUR_SECURE_PASSWORD

# Get connection name
gcloud sql instances describe divvai-db --format="value(connectionName)"
# Output: PROJECT_ID:REGION:divvai-db
```

## Step 2: Store Secrets in Secret Manager

```bash
# Database URL
echo "postgresql://divvai-user:PASSWORD@/divvai?host=/cloudsql/PROJECT_ID:REGION:divvai-db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Firebase Project ID
echo "your-project-id" | \
  gcloud secrets create FIREBASE_PROJECT_ID --data-file=-

# Firebase API Key (for frontend)
echo "your-api-key" | \
  gcloud secrets create FIREBASE_API_KEY --data-file=-

# Firebase Auth Domain (for frontend)
echo "your-project.firebaseapp.com" | \
  gcloud secrets create FIREBASE_AUTH_DOMAIN --data-file=-
```

## Step 3: Run Database Migrations

```bash
# Build API image locally or use Cloud Build
cd apps/api

# Set DATABASE_URL
export DATABASE_URL="postgresql://divvai-user:PASSWORD@/divvai?host=/cloudsql/PROJECT_ID:REGION:divvai-db"

# Run migrations
npm run db:migrate:deploy
```

Or use Cloud Build:

```bash
gcloud builds submit --config=cloudbuild-migrate.yaml
```

## Step 4: Deploy API to Cloud Run

```bash
# Build and push image
gcloud builds submit \
  --tag gcr.io/PROJECT_ID/divvai-api \
  --substitutions=_SERVICE=divvai-api \
  apps/api

# Deploy to Cloud Run
gcloud run deploy divvai-api \
  --image gcr.io/PROJECT_ID/divvai-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances=PROJECT_ID:REGION:divvai-db \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --port=4000
```

## Step 5: Deploy Web to Cloud Run

```bash
# Get API URL
API_URL=$(gcloud run services describe divvai-api \
  --region us-central1 \
  --format="value(status.url)")

# Build and push image
gcloud builds submit \
  --tag gcr.io/PROJECT_ID/divvai-web \
  --substitutions=_SERVICE=divvai-web \
  apps/web

# Deploy to Cloud Run
gcloud run deploy divvai-web \
  --image gcr.io/PROJECT_ID/divvai-web:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_API_URL=$API_URL" \
  --set-secrets="NEXT_PUBLIC_FIREBASE_API_KEY=FIREBASE_API_KEY:latest,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=FIREBASE_AUTH_DOMAIN:latest,NEXT_PUBLIC_FIREBASE_PROJECT_ID=FIREBASE_PROJECT_ID:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --port=3000
```

## Step 6: Configure GitHub Actions (CI/CD)

### 6.1 Set Up Workload Identity Federation

```bash
# Create Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --project=PROJECT_ID \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=PROJECT_ID \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create Service Account
gcloud iam service-accounts create github-actions \
  --project=PROJECT_ID \
  --display-name="GitHub Actions Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Allow GitHub to impersonate service account
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@PROJECT_ID.iam.gserviceaccount.com \
  --project=PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/OWNER/REPO"
```

### 6.2 Configure GitHub Secrets

Add these secrets to your GitHub repository:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `WIF_PROVIDER`: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `WIF_SERVICE_ACCOUNT`: `github-actions@PROJECT_ID.iam.gserviceaccount.com`

## Step 7: Verify Deployment

1. Get service URLs:
```bash
gcloud run services list --region us-central1
```

2. Test API health:
```bash
curl https://divvai-api-REGION-PROJECT_ID.a.run.app/health
```

3. Test frontend:
```bash
open https://divvai-web-REGION-PROJECT_ID.a.run.app
```

## Monitoring and Logs

```bash
# View API logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=divvai-api" --limit 50

# View Web logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=divvai-web" --limit 50

# View Cloud SQL logs
gcloud logging read "resource.type=cloudsql_database" --limit 50
```

## Cost Optimization

1. **Cloud Run**: Use min-instances=0 for cost savings (cold starts acceptable for MVP)
2. **Cloud SQL**: Start with db-f1-micro, scale up as needed
3. **Container Registry**: Clean up old images regularly
4. **Monitoring**: Set up billing alerts

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
gcloud sql connect divvai-db --user=divvai-user --database=divvai

# Check Cloud SQL proxy
# Ensure --add-cloudsql-instances flag is set correctly
```

### Authentication Issues

1. Verify Firebase Admin is initialized
2. Check service account has correct permissions
3. Verify Identity Platform OAuth providers are enabled
4. Check CORS settings match frontend URL

### Build Failures

```bash
# View build logs
gcloud builds list --limit=10
gcloud builds log BUILD_ID
```

## Production Checklist

- [ ] Enable Cloud SQL backups
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure custom domain
- [ ] Enable Cloud CDN (optional)
- [ ] Set up Cloud Armor (DDoS protection)
- [ ] Configure Cloud Logging retention
- [ ] Set up Cloud SQL high availability
- [ ] Enable Cloud Run traffic splitting for gradual rollouts
- [ ] Configure Cloud Run min-instances for zero cold starts (if needed)

