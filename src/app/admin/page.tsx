'use client';

import { useEffect, useState } from 'react';
import { getUserData, logout } from '@/lib/auth';
import { User, CreateUserRequest } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Omit<User, 'password'> | null>(null);
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    botConfig: {
      isActive: false,
      telegramChatId: '',
      monitoringInterval: 5,
    },
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = getUserData();
    if (!userData || userData.role !== 'admin') {
      router.push('/login');
      return;
    }
    setAdmin(userData);
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create user');
        return;
      }

      // Reset form and reload users
      setFormData({
        username: '',
        password: '',
        botConfig: {
          isActive: false,
          telegramChatId: '',
          monitoringInterval: 5,
        },
      });
      setShowCreateForm(false);
      await loadUsers();
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Layout Container */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-20 min-h-screen flex flex-col items-center py-6 space-y-6" style={{ backgroundColor: 'hsl(var(--primary))' }}>
          <div className="text-white text-sm font-bold">TP</div>
          <div className="flex flex-col space-y-4">
            <button className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
              <svg className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button className="p-3 rounded-lg text-white opacity-60 hover:opacity-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button className="p-3 rounded-lg text-white opacity-60 hover:opacity-100" onClick={logout}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="bg-white px-6 py-4 rounded-lg flex items-center space-x-4" style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                <h1 className="text-lg font-bold">TrustPositif Bot Manager - Admin</h1>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: 'hsl(var(--accent))' }}
              >
                {showCreateForm ? 'Cancel' : 'Create User'}
              </button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
              <div className="bg-white rounded-lg p-6 shadow-md mb-6">
                <h2 className="text-xl font-bold mb-4">Create New User</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-md border"
                      style={{ borderColor: 'hsl(var(--border))' }}
                      placeholder="Enter username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-md border"
                      style={{ borderColor: 'hsl(var(--border))' }}
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telegram Chat ID</label>
                    <input
                      type="text"
                      value={formData.botConfig.telegramChatId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          botConfig: { ...formData.botConfig, telegramChatId: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 rounded-md border"
                      style={{ borderColor: 'hsl(var(--border))' }}
                      placeholder="e.g., -1001234567890"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="botActive"
                      checked={formData.botConfig.isActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          botConfig: { ...formData.botConfig, isActive: e.target.checked },
                        })
                      }
                    />
                    <label htmlFor="botActive" className="text-sm">
                      Activate Bot Configuration
                    </label>
                  </div>

                  {error && (
                    <div className="text-sm" style={{ color: 'hsl(var(--danger))' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 rounded-md text-white font-medium"
                    style={{ backgroundColor: 'hsl(var(--accent))' }}
                  >
                    Create User
                  </button>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">User Management</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <th className="text-left px-4 py-3 font-semibold">Username</th>
                      <th className="text-left px-4 py-3 font-semibold">Role</th>
                      <th className="text-left px-4 py-3 font-semibold">Bot Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Telegram Chat ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                        <td className="px-4 py-3 font-medium">{user.username}</td>
                        <td className="px-4 py-3">
                          <span
                            className="badge"
                            style={{
                              backgroundColor: user.role === 'admin' ? 'hsl(var(--accent))' : 'hsl(var(--success))',
                              color: 'white',
                            }}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="badge"
                            style={{
                              backgroundColor: user.botConfig.isActive ? 'hsl(var(--success))' : 'hsl(var(--danger))',
                              color: 'white',
                            }}
                          >
                            {user.botConfig.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {user.botConfig.telegramChatId || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No users found
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>
                  {users.length}
                </div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total Users
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>
                  {users.filter((u) => u.botConfig.isActive).length}
                </div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Active Bots
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-2xl font-bold" style={{ color: 'hsl(var(--primary))' }}>
                  0
                </div>
                <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total Domains Monitored
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              © 2025 TrustPositif Bot Manager. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
