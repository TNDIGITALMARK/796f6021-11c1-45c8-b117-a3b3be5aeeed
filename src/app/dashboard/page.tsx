'use client';

import { useEffect, useState } from 'react';
import { getUserData, logout } from '@/lib/auth';
import { Domain, User } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(userData);
    loadDomains(userData.id);
  }, [router]);

  const loadDomains = async (userId: string) => {
    try {
      const response = await fetch(`/api/domains?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setDomains(data.data);
      }
    } catch (err) {
      console.error('Error loading domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDomain.trim()) return;

    setIsAdding(true);
    setError('');

    try {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          domain: newDomain.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to add domain');
        setIsAdding(false);
        return;
      }

      // Reload domains
      await loadDomains(user.id);
      setNewDomain('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    try {
      await fetch(`/api/domains?id=${domainId}`, {
        method: 'DELETE',
      });

      if (user) {
        await loadDomains(user.id);
      }
    } catch (err) {
      console.error('Error deleting domain:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                <h1 className="text-lg font-bold">TrustPositif Bot Manager</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🇮🇩</span>
                  <span className="text-sm">ID</span>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Domain List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
                    Real-time Link Monitoring
                  </h2>

                  {/* Add Domain Form */}
                  <form onSubmit={handleAddDomain} className="mb-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                      Tambah Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-4 py-2 rounded-md border"
                        style={{
                          borderColor: 'hsl(var(--border))',
                          fontSize: '13px',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="px-4 py-2 rounded-md text-white font-medium"
                        style={{
                          backgroundColor: isAdding ? 'hsl(var(--muted))' : 'hsl(var(--accent))',
                        }}
                      >
                        {isAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                    {error && (
                      <p className="text-sm mt-2" style={{ color: 'hsl(var(--danger))' }}>
                        {error}
                      </p>
                    )}
                  </form>

                  {/* Domain Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: 'hsl(var(--muted))' }}>
                          <th className="text-left px-4 py-3 font-semibold">Link</th>
                          <th className="text-left px-4 py-3 font-semibold">Status TrustPositif</th>
                          <th className="text-left px-4 py-3 font-semibold">Terakhir Dicek</th>
                          <th className="text-left px-4 py-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.map((domain) => (
                          <tr key={domain.id} className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                            <td className="px-4 py-3">
                              <a
                                href={`https://${domain.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                style={{ color: 'hsl(var(--accent))' }}
                              >
                                {domain.domain}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="badge"
                                style={{
                                  backgroundColor:
                                    domain.status === 'AMAN'
                                      ? 'hsl(var(--success))'
                                      : domain.status === 'DIBLOKIR'
                                      ? 'hsl(var(--danger))'
                                      : 'hsl(var(--warning))',
                                  color: 'white',
                                }}
                              >
                                {domain.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {formatDate(domain.lastChecked)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDeleteDomain(domain.id)}
                                className="text-xs px-2 py-1 rounded hover:opacity-80"
                                style={{
                                  backgroundColor: 'hsl(var(--danger))',
                                  color: 'white',
                                }}
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {domains.length === 0 && (
                      <div className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Belum ada domain yang ditambahkan
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Telegram Config */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-6 shadow-md" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  <h3 className="text-base font-semibold mb-4">Integrasi Telegram Bot</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Bot Username:</label>
                      <div className="px-3 py-2 rounded-md bg-white text-sm" style={{ color: 'hsl(var(--accent))' }}>
                        @crozxy_ceknawala_bot
                      </div>
                    </div>

                    <button
                      className="w-full py-2 rounded-md text-white font-medium"
                      style={{ backgroundColor: 'hsl(var(--accent))' }}
                    >
                      Konfigurasi Bot
                    </button>

                    <div className="pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <h4 className="text-sm font-semibold mb-2">Pengaturan Laporan Otomatis</h4>
                      <label className="flex items-center space-x-2 text-sm">
                        <input type="checkbox" className="rounded" checked readOnly />
                        <span>Interval: 5 menit</span>
                      </label>
                    </div>

                    <div className="pt-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                      <h4 className="text-sm font-semibold mb-2">Grup Terhubung</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" checked readOnly />
                          <span>#TrustCheck_ID</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" checked readOnly />
                          <span>#DokumenPublic</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              © 2025 TrustPositif Bot Manager. All rights reserved. | Kebijakan Privasi | Syarat Layanan
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
