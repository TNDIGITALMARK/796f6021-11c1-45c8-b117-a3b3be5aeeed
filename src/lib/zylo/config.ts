import { ZyloConfig } from './types';

/**
 * Loads and validates Zylo Client configuration from environment variables
 */
export function getZyloConfig(): ZyloConfig {
  const config: ZyloConfig = {
    controlPlaneUrl: process.env.NEXT_PUBLIC_CONTROL_PLANE_API_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    signedAppContext: process.env.NEXT_PUBLIC_SIGNED_APP_CONTEXT,
    tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  };

  // Validate required fields
  const errors: string[] = [];

  if (!config.supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }

  if (!config.supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  if (!config.controlPlaneUrl) {
    errors.push('NEXT_PUBLIC_CONTROL_PLANE_API_URL is required');
  }

  // Tenant and Project IDs are optional if signedAppContext is provided
  // But at least one method of identifying the app is required
  if (!config.signedAppContext && (!config.tenantId || !config.projectId)) {
    errors.push(
      'Either NEXT_PUBLIC_SIGNED_APP_CONTEXT or both NEXT_PUBLIC_TENANT_ID and NEXT_PUBLIC_PROJECT_ID must be provided'
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Zylo Client configuration error:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  return config;
}

/**
 * Debug utility to log configuration (without sensitive keys)
 */
export function debugConfig(config: ZyloConfig): void {
  console.log('[Zylo Config]', {
    controlPlaneUrl: config.controlPlaneUrl,
    supabaseUrl: config.supabaseUrl,
    hasAnonKey: !!config.supabaseAnonKey,
    hasSignedContext: !!config.signedAppContext,
    tenantId: config.tenantId,
    projectId: config.projectId,
  });
}
