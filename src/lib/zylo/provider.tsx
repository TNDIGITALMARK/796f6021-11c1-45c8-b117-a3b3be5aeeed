'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { ZyloClient } from './client';
import { getZyloConfig } from './config';
import { ZyloContextValue, TokenStatus } from './types';

export const ZyloContext = createContext<ZyloContextValue | null>(null);

interface ZyloProviderProps {
  children: ReactNode;
}

/**
 * Zylo Provider - Initializes and provides Zylo Client to the app
 *
 * Features:
 * - Auto-boots client on mount (attempts scoped anon, falls back to env anon)
 * - Provides client instance via React context
 * - Manages loading and error states
 * - Cleans up timers on unmount
 */
export function ZyloProvider({ children }: ZyloProviderProps) {
  const [client] = useState(() => {
    try {
      const config = getZyloConfig();
      return new ZyloClient(config);
    } catch (error) {
      console.error('Failed to initialize Zylo Client:', error);
      throw error;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    type: 'FALLBACK_ANON',
    expiresAt: null,
    isExpired: false,
    hasSignedContext: false,
  });

  useEffect(() => {
    // Boot the client on mount
    client
      .boot()
      .then(() => {
        setTokenStatus(client.getTokenStatus());
        setIsLoading(false);
        console.log('✅ Zylo Provider: Client booted successfully');
      })
      .catch((err) => {
        console.error('❌ Zylo Provider: Boot failed', err);
        setError(err);
        setIsLoading(false);
      });

    // Cleanup: clear timers on unmount
    return () => {
      client.cleanup();
    };
  }, [client]);

  // Update token status periodically for debugging
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenStatus(client.getTokenStatus());
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [client]);

  // Show error state
  if (error) {
    return (
      <div
        style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
          Zylo Client Error
        </h2>
        <p style={{ margin: '0', fontSize: '14px' }}>{error.message}</p>
        <details style={{ marginTop: '10px', fontSize: '12px' }}>
          <summary style={{ cursor: 'pointer' }}>Stack Trace</summary>
          <pre style={{ marginTop: '10px', fontSize: '11px', overflow: 'auto' }}>
            {error.stack}
          </pre>
        </details>
      </div>
    );
  }

  // Provide client to children
  return (
    <ZyloContext.Provider value={{ client, isLoading, error, tokenStatus }}>
      {children}
    </ZyloContext.Provider>
  );
}
