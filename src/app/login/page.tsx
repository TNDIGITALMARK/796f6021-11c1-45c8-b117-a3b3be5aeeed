'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken, setUserData } from '@/lib/auth';
import { LoginRequest } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Store auth token and user data
      setAuthToken(data.data.token);
      setUserData(data.data.user);

      // Redirect based on role
      if (data.data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg p-8 shadow-md">
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <div
              className="text-2xl font-bold mb-2"
              style={{ color: 'hsl(var(--primary))' }}
            >
              TrustPositif Bot Manager
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Login untuk melanjutkan
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-md text-sm"
              style={{
                backgroundColor: 'hsl(var(--danger) / 0.1)',
                color: 'hsl(var(--danger))',
                border: '1px solid hsl(var(--danger) / 0.3)',
              }}
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'white',
                  color: 'hsl(var(--foreground))',
                }}
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'white',
                  color: 'hsl(var(--foreground))',
                }}
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-md font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: isLoading
                  ? 'hsl(var(--muted))'
                  : 'hsl(var(--accent))',
                color: 'white',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div
            className="mt-6 p-3 rounded-md text-xs"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <strong>Default Admin:</strong>
            <br />
            Username: admin
            <br />
            Password: admin123
          </div>
        </div>
      </div>
    </div>
  );
}
