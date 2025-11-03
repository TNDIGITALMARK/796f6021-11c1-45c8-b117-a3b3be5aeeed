'use client';

import { useContext } from 'react';
import { ZyloContext } from './provider';
import { ZyloClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook to access the Zylo Client instance
 *
 * @throws Error if used outside ZyloProvider
 */
export function useZylo(): ZyloClient {
  const context = useContext(ZyloContext);
  if (!context) {
    throw new Error('useZylo must be used within ZyloProvider');
  }
  return context.client;
}

/**
 * Hook to access the Supabase client (with scoped token)
 *
 * This is the primary way components should interact with Supabase.
 * The client is automatically configured with the appropriate token
 * (user-scoped, scoped anon, or fallback anon).
 *
 * @example
 * const supabase = useSupabase();
 * const { data } = await supabase.from('pokemon_cards').select('*');
 */
export function useSupabase(): SupabaseClient {
  const client = useZylo();
  return client.getSupabase();
}

/**
 * Hook to access authentication methods and state
 *
 * @example
 * const auth = useAuth();
 * await auth.signUp('email@example.com', 'password', { full_name: 'John Doe' });
 * await auth.login('email@example.com', 'password');
 * const user = await auth.getCurrentUser();
 * await auth.logout();
 */
export function useAuth() {
  const client = useZylo();
  return {
    signUp: client.signUp.bind(client),
    login: client.login.bind(client),
    logout: client.logout.bind(client),
    isAuthenticated: client.isAuthenticated.bind(client),
    getCurrentUser: client.getCurrentUser.bind(client),
  };
}

/**
 * Hook to access token status for debugging
 *
 * @example
 * const status = useTokenStatus();
 * console.log(status.type); // 'USER_SCOPED' | 'SCOPED_ANON' | 'FALLBACK_ANON'
 * console.log(status.expiresAt); // Date or null
 */
export function useTokenStatus() {
  const context = useContext(ZyloContext);
  if (!context) {
    throw new Error('useTokenStatus must be used within ZyloProvider');
  }
  return context.tokenStatus;
}

/**
 * Hook to access loading state
 */
export function useZyloLoading(): boolean {
  const context = useContext(ZyloContext);
  if (!context) {
    throw new Error('useZyloLoading must be used within ZyloProvider');
  }
  return context.isLoading;
}
