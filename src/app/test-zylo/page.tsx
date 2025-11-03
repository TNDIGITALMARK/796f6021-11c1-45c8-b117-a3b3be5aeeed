'use client';

import { useEffect, useState } from 'react';
import { useSupabase, useAuth, useTokenStatus, useZyloLoading } from '@/lib/zylo/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function TestZyloPage() {
  const supabase = useSupabase();
  const auth = useAuth();
  const tokenStatus = useTokenStatus();
  const isLoading = useZyloLoading();

  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    auth.getCurrentUser().then((user) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      await auth.login(email, password);
      const currentUser = await auth.getCurrentUser();
      setUser(currentUser);
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getTokenTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'USER_SCOPED':
        return 'default';
      case 'SCOPED_ANON':
        return 'secondary';
      case 'FALLBACK_ANON':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Zylo Client Test Dashboard</h1>

      {/* Token Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Token Status</CardTitle>
          <CardDescription>Current authentication token state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Token Type:</span>
            <Badge variant={getTokenTypeBadgeVariant(tokenStatus.type)}>
              {tokenStatus.type}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">Expires At:</span>
            <span className="text-sm">
              {tokenStatus.expiresAt
                ? tokenStatus.expiresAt.toLocaleString()
                : 'No expiry (fallback mode)'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">Is Expired:</span>
            <Badge variant={tokenStatus.isExpired ? 'destructive' : 'secondary'}>
              {tokenStatus.isExpired ? 'Yes' : 'No'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-medium">Has Signed Context:</span>
            <Badge variant={tokenStatus.hasSignedContext ? 'default' : 'outline'}>
              {tokenStatus.hasSignedContext ? 'Yes' : 'No (using raw IDs)'}
            </Badge>
          </div>

          {isLoading && (
            <div className="text-sm text-muted-foreground">Loading Zylo Client...</div>
          )}
        </CardContent>
      </Card>

      {/* Session Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Current Supabase session details</CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-2">
              <div>
                <span className="font-medium">Access Token (first 50 chars):</span>
                <code className="block mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {session.access_token.substring(0, 50)}...
                </code>
              </div>
              <div>
                <span className="font-medium">Token Expires At:</span>
                <span className="block mt-1 text-sm">
                  {session.expires_at
                    ? new Date(session.expires_at * 1000).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              {user && (
                <div>
                  <span className="font-medium">User ID:</span>
                  <span className="block mt-1 text-sm">{user.id}</span>
                </div>
              )}
              {user?.email && (
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="block mt-1 text-sm">{user.email}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No active session</p>
          )}
        </CardContent>
      </Card>

      {/* Login/Logout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            {user ? 'You are logged in' : 'Test user authentication'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm font-medium">Logged in as: {user.email || user.id}</p>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{loginError}</p>
                </div>
              )}
              <Button type="submit" disabled={loginLoading}>
                {loginLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Full token status object</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
            {JSON.stringify(tokenStatus, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
