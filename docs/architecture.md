# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                           │
│                    (Next.js Frontend)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Login      │  │  Dashboard   │  │   Groups     │       │
│  │   Page       │  │   Page       │  │   Page       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            │ HTTPS
                            │ Authorization: Bearer <token>
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Cloud Run (API)                            │
│                  ┌─────────────────┐                         │
│                  │  NestJS Server  │                         │
│                  └────────┬────────┘                         │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                │
│    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐         │
│    │  Auth   │      │  Groups   │    │ Expenses  │         │
│    │ Module  │      │  Module   │    │  Module   │         │
│    └────┬────┘      └─────┬─────┘    └─────┬─────┘         │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                   │
│                    ┌──────▼──────┐                          │
│                    │   Prisma     │                          │
│                    │   Service   │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ Private IP
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Cloud SQL                                  │
│                  PostgreSQL 14                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  users   │  │  groups  │  │ expenses │  │settlements│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: Firebase Auth Web SDK
- **State Management**: React hooks + API client

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Cloud SQL)
- **Authentication**: Firebase Admin SDK
- **Validation**: class-validator
- **Rate Limiting**: @nestjs/throttler

### Infrastructure
- **Hosting**: Google Cloud Run
- **Database**: Cloud SQL (PostgreSQL)
- **Authentication**: Google Cloud Identity Platform
- **Secrets**: Secret Manager
- **CI/CD**: GitHub Actions with Workload Identity Federation
- **Container Registry**: Google Container Registry

## Data Flow

### Authentication Flow
1. User clicks "Sign in with Google/GitHub"
2. Firebase Auth SDK handles OAuth
3. Returns ID token to frontend
4. Frontend stores token and includes in API requests
5. Backend verifies token with Firebase Admin
6. Backend creates/updates user record
7. Returns user profile

### Expense Creation Flow
1. User fills expense form
2. Frontend validates and sends to API
3. API verifies group membership
4. API creates expense and expense_items
5. API returns created expense
6. Frontend refreshes group page

### Balance Calculation Flow
1. User views group balances
2. Frontend requests `/groups/:id/balance`
3. API fetches all expenses and settlements
4. API calculates balances for each member
5. Returns balance data
6. Frontend displays balances with settle suggestions

## Security

### Authentication
- ID tokens verified on every request
- Tokens expire after 1 hour (auto-refreshed)
- No session storage (stateless)

### Authorization
- Group membership verified on every operation
- Users can only access their groups
- Role-based access (owner/member) for future features

### Data Protection
- CORS configured for specific origins
- Rate limiting prevents abuse
- Input validation on all endpoints
- SQL injection prevented by Prisma
- XSS protection via React

## Scalability Considerations

### Current (MVP)
- Cloud Run auto-scales 0-10 instances
- Cloud SQL db-f1-micro (can scale up)
- Stateless API (horizontal scaling ready)

### Future Enhancements
- Redis caching for balance calculations
- CDN for static assets
- Database read replicas
- Background jobs for heavy calculations
- WebSocket for real-time updates

## Monitoring

### Logging
- Structured logging via NestJS Logger
- Cloud Logging integration
- Request/response logging
- Error tracking

### Metrics
- Cloud Run metrics (requests, latency, errors)
- Database connection pool metrics
- Custom business metrics (expenses created, groups created)

## Error Handling

### Frontend
- API errors caught and displayed to user
- Network errors retried automatically
- Form validation errors shown inline

### Backend
- Global exception filter
- HTTP status codes (400, 401, 403, 404, 500)
- Structured error responses
- Error logging for debugging

## Development Workflow

1. **Local Development**
   - Run frontend and API locally
   - Use local PostgreSQL
   - Firebase emulator (optional)

2. **Testing**
   - Unit tests for services
   - Integration tests for API endpoints
   - E2E tests for critical flows

3. **Deployment**
   - Push to main branch
   - GitHub Actions builds and deploys
   - Zero-downtime deployment via Cloud Run

## Performance Targets

- **Page Load**: < 2s (First Contentful Paint)
- **API Response**: < 200ms (p95)
- **Group Creation**: < 15s (user goal)
- **Balance Calculation**: < 500ms (for groups with < 100 expenses)

## Future Enhancements

- Receipt OCR for automatic expense extraction
- Multi-currency support
- Recurring expenses
- Expense categories and budgets
- Export to CSV/PDF
- Mobile app (React Native)
- Real-time notifications
- Group templates

