'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { GroupWithMembers } from '@divvai/shared';
import { Button } from '@/components/ui/button';

export default function NewExpensePage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const groupData = await api.getGroup(groupId);
      // API returns GroupWithMembers which has members array
      setGroup(groupData as any);
    } catch (error) {
      console.error('Failed to load group:', error);
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;
    const groupWithMembers = group as any;
    if (!groupWithMembers || !groupWithMembers.members || groupWithMembers.members.length === 0) {
      alert('Group has no members');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    const totalAmount = parseFloat(amount);
    let items: { userId: string; amount: number }[] = [];

    if (splitType === 'equal') {
      // Equal split among all members
      const amountPerPerson = totalAmount / groupWithMembers.members.length;
      items = groupWithMembers.members.map((member: any) => ({
        userId: member.userId,
        amount: Math.round(amountPerPerson * 100) / 100, // Round to 2 decimals
      }));
      
      // Adjust for rounding errors - add remainder to first person
      const sum = items.reduce((s, item) => s + item.amount, 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        items[0].amount = Math.round((items[0].amount + (totalAmount - sum)) * 100) / 100;
      }
    } else {
      // For now, if custom split, just assign to current user
      // TODO: Implement custom split UI
      items = [{
        userId: currentUser.uid,
        amount: totalAmount,
      }];
    }

    setLoading(true);
    try {
      await api.createExpense(groupId, {
        amount: totalAmount,
        currency: 'USD',
        description,
        category: category || undefined,
        date,
        items,
      });
      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error('Failed to create expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Expense</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Dinner at restaurant"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category (optional)
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Food, Travel, Entertainment"
              />
            </div>

            {group && (group as any).members && (group as any).members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitType === 'equal'}
                      onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                      className="mr-2"
                    />
                    Equal split ({(group as any).members.length} people)
                  </label>
                </div>
                {splitType === 'equal' && amount && (
                  <p className="text-sm text-gray-500 mt-2">
                    Each person: ${(parseFloat(amount) / (group as any).members.length).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                💡 Receipt upload coming soon. For now, you can add expenses manually.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !description.trim() || !amount}>
                {loading ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

