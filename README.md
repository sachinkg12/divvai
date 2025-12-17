# Divvai - Group Expense App

A fast, web-first group expense splitting application built with Next.js, NestJS, and Google Cloud Platform.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: NestJS + TypeScript + PostgreSQL
- **Auth**: Google Cloud Identity Platform (Google + GitHub OAuth)
- **Deployment**: Cloud Run (Frontend + API)
- **CI/CD**: GitHub Actions with OIDC

## Monorepo Structure

```
.
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and utilities
└── docs/             # Documentation and diagrams
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (or Cloud SQL)
- Google Cloud Project with Identity Platform enabled

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy example env files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

3. Start development servers:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- API: http://localhost:4000

### Database Setup

1. Create a PostgreSQL database
2. Run migrations:
```bash
npm run db:migrate
```

## Authentication Flow

See [docs/auth-flow.md](./docs/auth-flow.md) for detailed authentication flow diagrams.

## Deployment

See [docs/deployment.md](./docs/deployment.md) for GCP deployment instructions.

## License

MIT
