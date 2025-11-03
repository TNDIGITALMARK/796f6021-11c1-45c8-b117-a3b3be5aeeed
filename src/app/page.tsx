'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserData } from '@/lib/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const user = getUserData();

    if (!user) {
      // No user logged in, redirect to login
      router.push('/login');
      return;
    }

    // Redirect based on user role
    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'hsl(var(--primary))' }}></div>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
      </div>
    </div>
  );
}
