// ============================================
// API ROUTE: Domain Management
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { DomainDatabase } from '@/lib/database';
import { isValidDomain, formatDomain, checkDomainStatus } from '@/lib/trustpositif-checker';
import { AddDomainRequest } from '@/lib/types';

// GET domains by user ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const domains = await DomainDatabase.getDomainsByUserId(userId);

    return NextResponse.json({
      success: true,
      data: domains,
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, domain } = body as AddDomainRequest & { userId: string };

    if (!userId || !domain) {
      return NextResponse.json(
        { success: false, error: 'User ID and domain are required' },
        { status: 400 }
      );
    }

    // Format and validate domain
    const formattedDomain = formatDomain(domain);

    if (!isValidDomain(formattedDomain)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Check if domain already exists for this user
    const existingDomains = await DomainDatabase.getDomainsByUserId(userId);
    const domainExists = existingDomains.some((d) => d.domain === formattedDomain);

    if (domainExists) {
      return NextResponse.json(
        { success: false, error: 'Domain already exists in your list' },
        { status: 400 }
      );
    }

    // Check domain status on TrustPositif
    const checkResult = await checkDomainStatus(formattedDomain);

    // Create domain
    const newDomain = await DomainDatabase.createDomain({
      userId,
      domain: formattedDomain,
      status: checkResult.status,
      lastChecked: checkResult.checkedAt,
      statusHistory: [
        {
          status: checkResult.status,
          checkedAt: checkResult.checkedAt,
          details: checkResult.error,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: newDomain,
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE domain
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('id');

    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const success = await DomainDatabase.deleteDomain(domainId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
