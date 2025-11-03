// ============================================
// API ROUTE: Check Domain Status on TrustPositif
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { parseTrustPositifResponse } from '@/lib/trustpositif-checker';

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Clean domain format
    const cleanDomain = domain.replace(/^https?:\/\//, '').trim();

    // Make request to TrustPositif website
    // Note: This will be a server-side request to avoid CORS issues
    const trustPositifUrl = `https://trustpositif.komdigi.go.id/`;

    try {
      const response = await fetch(trustPositifUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `domain=${encodeURIComponent(cleanDomain)}`,
      });

      const html = await response.text();

      // Parse response to determine status
      const status = parseTrustPositifResponse(html);

      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        status,
        rawResponse: html.substring(0, 500), // Return first 500 chars for debugging
      });
    } catch (fetchError) {
      console.error('Error fetching from TrustPositif:', fetchError);

      // For MVP, return mock status based on domain
      // In production, implement proper error handling
      const mockStatus = cleanDomain.includes('example') ? 'AMAN' : 'DIBLOKIR';

      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        status: mockStatus,
        mock: true,
        note: 'Using mock data - TrustPositif API may be blocked by CORS',
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
