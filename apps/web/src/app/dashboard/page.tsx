'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { api } from '@/lib/api';
import { Group, UserProfile } from '@divvai/shared';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [profile, groupsData] = await Promise.all([
        api.getProfile(),
        api.getGroups(),
      ]);
      setUser(profile);
      setGroups(groupsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Divvai</h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-700">{user.name}</span>
              )}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
          <Button onClick={() => router.push('/groups/new')}>
            Create Group
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No groups yet. Create your first group to get started!</p>
            <Button onClick={() => router.push('/groups/new')}>
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-gray-600 mb-4">{group.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

