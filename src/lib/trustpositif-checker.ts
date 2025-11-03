// ============================================
// TRUSTPOSITIF CHECKER SERVICE
// Checks domain status on https://trustpositif.komdigi.go.id/
// ============================================

import { DomainStatus, TrustPositifCheckResult } from './types';

const TRUSTPOSITIF_URL = 'https://trustpositif.komdigi.go.id/';

/**
 * Checks if a domain is blocked on TrustPositif
 * @param domain Domain without https://, e.g., "example.com"
 * @returns Check result with status
 */
export async function checkDomainStatus(domain: string): Promise<TrustPositifCheckResult> {
  try {
    // Remove any protocol prefix if present
    const cleanDomain = domain.replace(/^https?:\/\//, '').trim();

    if (!cleanDomain) {
      return {
        domain,
        status: 'ERROR',
        checkedAt: new Date().toISOString(),
        error: 'Invalid domain format',
      };
    }

    // Make request to TrustPositif website
    // Note: In production, you may need to use a proxy or server-side request
    // due to CORS restrictions
    const response = await fetch(`/api/check-domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: cleanDomain }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      domain: cleanDomain,
      status: data.status,
      checkedAt: new Date().toISOString(),
      rawResponse: data.rawResponse,
    };
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error);
    return {
      domain,
      status: 'ERROR',
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks multiple domains in parallel
 * @param domains Array of domains to check
 * @returns Array of check results
 */
export async function checkMultipleDomains(
  domains: string[]
): Promise<TrustPositifCheckResult[]> {
  const checks = domains.map((domain) => checkDomainStatus(domain));
  return Promise.all(checks);
}

/**
 * Parses TrustPositif HTML response to determine status
 * @param html HTML response from TrustPositif
 * @returns Domain status
 */
export function parseTrustPositifResponse(html: string): DomainStatus {
  // Check if response contains "Ada" (blocked) or "Tidak Ada" (safe)
  const upperHtml = html.toUpperCase();

  if (upperHtml.includes('ADA') && !upperHtml.includes('TIDAK ADA')) {
    // Domain is blocked
    return 'DIBLOKIR';
  } else if (upperHtml.includes('TIDAK ADA')) {
    // Domain is safe
    return 'AMAN';
  } else {
    // Unable to determine status
    return 'ERROR';
  }
}

/**
 * Validates domain format
 * @param domain Domain string to validate
 * @returns True if valid domain format
 */
export function isValidDomain(domain: string): boolean {
  const cleanDomain = domain.replace(/^https?:\/\//, '').trim();

  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

  return domainRegex.test(cleanDomain);
}

/**
 * Formats domain by removing protocol and trailing slashes
 * @param domain Domain to format
 * @returns Formatted domain
 */
export function formatDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .trim()
    .toLowerCase();
}
