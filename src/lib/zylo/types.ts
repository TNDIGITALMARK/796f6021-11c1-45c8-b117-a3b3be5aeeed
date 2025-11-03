import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Token types in priority order (highest to lowest)
 */
export type TokenType = 'USER_SCOPED' | 'SCOPED_ANON' | 'FALLBACK_ANON';

/**
 * Response from Control Plane token exchange endpoints
 */
export interface TokenResponse {
  access_token: string;
  expires_in: number; // seconds until expiry
  token_type?: string;
}

/**
 * Zylo Client configuration
 */
export interface ZyloConfig {
  controlPlaneUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  signedAppContext?: string; // Placeholder for future Ed25519 signed JWT
  tenantId?: string;
  projectId?: string;
}

/**
 * Internal client state
 */
export interface ZyloClientState {
  token: string | null;
  tokenExpiry: number | null; // timestamp in ms
  currentTokenType: TokenType;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Auth user from Supabase
 */
export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: any;
}

/**
 * React context value
 */
export interface ZyloContextValue {
  client: any; // Will be ZyloClient but avoiding circular ref
  isLoading: boolean;
  error: Error | null;
  tokenStatus: TokenStatus;
}

/**
 * Token status for debugging
 */
export interface TokenStatus {
  type: TokenType;
  expiresAt: Date | null;
  isExpired: boolean;
  hasSignedContext: boolean;
}
