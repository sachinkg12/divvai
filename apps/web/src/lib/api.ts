import { UserProfile, ApiResponse, Group, Expense, GroupBalance } from '@divvai/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    return user ? user.getIdToken() : null;
  }

  // Auth
  async getProfile(): Promise<UserProfile> {
    const response = await this.request<UserProfile>('/auth/profile');
    return response.data;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    const response = await this.request<Group[]>('/groups');
    return response.data;
  }

  async getGroup(id: string): Promise<Group> {
    const response = await this.request<Group>(`/groups/${id}`);
    return response.data;
  }

  async createGroup(data: { name: string; description?: string; memberIds?: string[] }): Promise<Group> {
    const response = await this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Expenses
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    const response = await this.request<Expense[]>(`/groups/${groupId}/expenses`);
    return response.data;
  }

  async createExpense(groupId: string, data: {
    amount: number;
    currency: string;
    description: string;
    category?: string;
    date: string;
    items: { userId: string; amount: number }[];
  }): Promise<Expense> {
    const response = await this.request<Expense>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Balances
  async getGroupBalance(groupId: string): Promise<GroupBalance> {
    const response = await this.request<GroupBalance>(`/groups/${groupId}/balance`);
    return response.data;
  }

  // Settlements
  async createSettlement(groupId: string, data: {
    toUserId: string;
    amount: number;
    currency: string;
  }): Promise<void> {
    await this.request(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

