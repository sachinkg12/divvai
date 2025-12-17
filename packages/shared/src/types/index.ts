// User types
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'github';
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: Date;
  user?: User;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  memberCount: number;
}

// Expense types
export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  receiptUrl?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  paidByUser?: User;
  items: ExpenseItem[];
}

export interface ExpenseItem {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  createdAt: Date;
  user?: User;
}

// Settlement types
export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  completedAt?: Date;
  createdAt: Date;
  fromUser?: User;
  toUser?: User;
}

// Balance types
export interface UserBalance {
  userId: string;
  userName: string;
  userPicture?: string;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
}

export interface GroupBalance {
  groupId: string;
  groupName: string;
  balances: UserBalance[];
  settlements: Settlement[];
}

// API Request/Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthTokenPayload {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  provider: 'google' | 'github';
  iat: number;
  exp: number;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface CreateExpenseRequest {
  groupId: string;
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: string;
  items: {
    userId: string;
    amount: number;
  }[];
}

export interface CreateSettlementRequest {
  groupId: string;
  toUserId: string;
  amount: number;
  currency: string;
}

