'use client'

import dynamic from 'next/dynamic'
import { ReactNode, ComponentType } from 'react'

// Utility for safely loading browser-only components
// This prevents SSR crashes when components use window, navigator, localStorage, etc.
export function createClientSafeComponent<P = {}>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  return dynamic(loader, {
    ssr: false, // Disable server-side rendering
    loading: () => (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100px',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        {fallback || 'Loading...'}
      </div>
    ),
  })
}

// Example browser-safe component wrapper
export const BrowserOnlyWrapper = ({ children }: { children: ReactNode }) => {
  // This component only renders on the client side
  // Useful for wrapping components that use browser APIs
  
  if (typeof window === 'undefined') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100px',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        Loading interactive content...
      </div>
    )
  }

  return <>{children}</>
}

// Utility hook for browser-only effects
export function useBrowserOnly(callback: () => void, deps: any[] = []) {
  if (typeof window !== 'undefined') {
    callback()
  }
}

// Safe browser API access
export const browserAPI = {
  // Safe localStorage access
  localStorage: {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string): boolean => {
      if (typeof window === 'undefined') return false
      try {
        window.localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
    removeItem: (key: string): boolean => {
      if (typeof window === 'undefined') return false
      try {
        window.localStorage.removeItem(key)
        return true
      } catch {
        return false
      }
    }
  },

  // Safe sessionStorage access
  sessionStorage: {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null
      try {
        return window.sessionStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem: (key: string, value: string): boolean => {
      if (typeof window === 'undefined') return false
      try {
        window.sessionStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    }
  },

  // Safe navigator access
  navigator: {
    userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : '',
    language: typeof window !== 'undefined' ? window.navigator?.language : 'en',
    onLine: typeof window !== 'undefined' ? window.navigator?.onLine : true,
  },

  // Safe window access
  window: {
    innerWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    innerHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    location: {
      href: typeof window !== 'undefined' ? window.location?.href : '',
      pathname: typeof window !== 'undefined' ? window.location?.pathname : '/',
    }
  }
}

export default BrowserOnlyWrapper