'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Group, Expense, GroupBalance, UserBalance } from '@divvai/shared';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@divvai/shared';

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('balances');

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      const [groupData, expensesData, balanceData] = await Promise.all([
        api.getGroup(groupId),
        api.getGroupExpenses(groupId),
        api.getGroupBalance(groupId),
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Group not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-gray-600 mt-2">{group.description}</p>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'balances'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Balances
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Expenses
          </button>
          <div className="flex-1" />
          <Button onClick={() => router.push(`/groups/${groupId}/expenses/new`)}>
            Add Expense
          </Button>
        </div>

        {activeTab === 'balances' && balance && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Balances</h2>
              <div className="space-y-4">
                {balance.balances.map((userBalance: UserBalance) => {
                  const netBalance = userBalance.netBalance;
                  if (Math.abs(netBalance) < 0.01) return null;

                  return (
                    <div
                      key={userBalance.userId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {userBalance.userPicture && (
                          <img
                            src={userBalance.userPicture}
                            alt={userBalance.userName}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{userBalance.userName}</p>
                          <p className="text-sm text-gray-500">
                            {netBalance > 0
                              ? `Owes ${formatCurrency(userBalance.totalOwed)}`
                              : `Owed ${formatCurrency(userBalance.totalOwing)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-semibold ${
                            netBalance > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {netBalance > 0
                            ? `+${formatCurrency(netBalance)}`
                            : formatCurrency(netBalance)}
                        </p>
                        {netBalance < 0 && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={async () => {
                              // TODO: Implement settlement
                              alert('Settlement feature coming soon');
                            }}
                          >
                            Settle Up
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense!</p>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{expense.description}</h3>
                          <p className="text-sm text-gray-500">
                            Paid by {expense.paidByUser?.name || 'Unknown'} on{' '}
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                        </div>
                      </div>
                      {expense.items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Split among:</p>
                          <div className="flex flex-wrap gap-2">
                            {expense.items.map((item) => (
                              <span
                                key={item.id}
                                className="text-xs bg-gray-100 px-2 py-1 rounded"
                              >
                                {item.user?.name || 'Unknown'}: {formatCurrency(item.amount, expense.currency)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

