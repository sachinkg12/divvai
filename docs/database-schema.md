# Database Schema

## Overview

PostgreSQL database with Prisma ORM. Schema designed for group expense splitting with audit logging.

## Tables

### users
Stores user accounts created via Identity Platform authentication.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String (unique) | User email |
| name | String | Display name |
| picture | String? | Profile picture URL |
| provider | String | 'google' or 'github' |
| providerId | String (unique) | Firebase UID |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Indexes**: email, providerId

### groups
Expense groups (e.g., "Weekend Trip", "Household Expenses").

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Group name |
| description | String? | Optional description |
| createdBy | UUID | Foreign key to users.id |
| createdAt | DateTime | Group creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Indexes**: createdBy

### group_members
Many-to-many relationship between users and groups.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| groupId | UUID | Foreign key to groups.id |
| userId | UUID | Foreign key to users.id |
| role | String | 'owner' or 'member' |
| joinedAt | DateTime | When user joined group |

**Unique Constraint**: (groupId, userId)
**Indexes**: groupId, userId

### expenses
Individual expenses within a group.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| groupId | UUID | Foreign key to groups.id |
| paidBy | UUID | Foreign key to users.id (who paid) |
| amount | Decimal(10,2) | Total expense amount |
| currency | String | Currency code (default: USD) |
| description | String | Expense description |
| category | String? | Optional category |
| receiptUrl | String? | Receipt image URL (future) |
| date | DateTime | When expense occurred |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Indexes**: groupId, paidBy, date

### expense_items
How an expense is split among group members.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| expenseId | UUID | Foreign key to expenses.id |
| userId | UUID | Foreign key to users.id |
| amount | Decimal(10,2) | User's share of expense |
| createdAt | DateTime | Record creation timestamp |

**Unique Constraint**: (expenseId, userId)
**Indexes**: expenseId, userId

**Note**: Sum of expense_items.amount should equal expenses.amount

### settlements
Record of payments between users to settle balances.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| groupId | UUID | Foreign key to groups.id |
| fromUserId | UUID | Foreign key to users.id (who pays) |
| toUserId | UUID | Foreign key to users.id (who receives) |
| amount | Decimal(10,2) | Settlement amount |
| currency | String | Currency code (default: USD) |
| status | String | 'pending', 'completed', or 'cancelled' |
| completedAt | DateTime? | When settlement was completed |
| createdAt | DateTime | Record creation timestamp |

**Indexes**: groupId, fromUserId, toUserId, status

### audit_logs
Audit trail for important actions.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID? | Foreign key to users.id (who performed action) |
| groupId | UUID? | Foreign key to groups.id (related group) |
| action | String | Action type (e.g., 'expense.created') |
| metadata | JSON? | Additional action data |
| createdAt | DateTime | Action timestamp |

**Indexes**: userId, groupId, action, createdAt

## Relationships

```
users
  ├── groupsCreated (one-to-many)
  ├── groupMemberships (many-to-many via group_members)
  ├── expensesPaid (one-to-many)
  ├── expenseItems (one-to-many)
  ├── settlementsFrom (one-to-many)
  ├── settlementsTo (one-to-many)
  └── auditLogs (one-to-many)

groups
  ├── creator (many-to-one)
  ├── members (many-to-many via group_members)
  ├── expenses (one-to-many)
  ├── settlements (one-to-many)
  └── auditLogs (one-to-many)

expenses
  ├── group (many-to-one)
  ├── paidByUser (many-to-one)
  └── items (one-to-many)

expense_items
  ├── expense (many-to-one)
  └── user (many-to-one)

settlements
  ├── group (many-to-one)
  ├── fromUser (many-to-one)
  └── toUser (many-to-one)
```

## Balance Calculation Logic

Balances are calculated dynamically from expenses and settlements:

1. **Total Owed**: Sum of all expenses where user is `paidBy`
2. **Total Owing**: Sum of all `expense_items.amount` where user is participant
3. **Net Balance**: `totalOwed - totalOwing`
4. **Settlements**: Completed settlements reduce both owed and owing amounts

Example:
- User A pays $100 for dinner
- Split equally: A owes $50, B owes $50
- A's balance: +$50 (owed $100, owing $50)
- B's balance: -$50 (owed $0, owing $50)

## Migration Strategy

Prisma migrations are used for schema changes:

```bash
# Create migration
cd apps/api
npm run db:migrate

# Apply migrations in production
npm run db:migrate:deploy
```

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Pagination**: Use cursor-based pagination for large result sets
3. **Caching**: Consider caching balance calculations for frequently accessed groups
4. **Partitioning**: Audit logs could be partitioned by date for large datasets

## Future Enhancements

- Receipt storage (Cloud Storage URLs)
- Multi-currency support
- Recurring expenses
- Expense categories with budgets
- Group templates
- Export to CSV/PDF

