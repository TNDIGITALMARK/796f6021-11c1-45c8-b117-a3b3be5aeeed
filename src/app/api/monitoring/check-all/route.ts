// ============================================
// API ROUTE: Check All Domains and Send Reports
// This endpoint will be called by cron job every 5 minutes
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabase, DomainDatabase } from '@/lib/database';
import { checkMultipleDomains } from '@/lib/trustpositif-checker';
import { sendMonitoringReport, sendBlockedAlert } from '@/lib/telegram-bot';
import { MonitoringReport, DomainReportEntry } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting scheduled monitoring check...');

    // Get all users with active bot config
    const allUsers = await AdminDatabase.getAllUsers();
    const activeUsers = allUsers.filter((user) => user.botConfig.isActive && user.botConfig.telegramChatId);

    console.log(`Found ${activeUsers.length} active users`);

    const results = [];

    for (const user of activeUsers) {
      try {
        // Get user's domains
        const domains = await DomainDatabase.getDomainsByUserId(user.id);

        if (domains.length === 0) {
          console.log(`User ${user.username} has no domains to check`);
          continue;
        }

        console.log(`Checking ${domains.length} domains for user ${user.username}`);

        // Check all domains
        const domainList = domains.map((d) => d.domain);
        const checkResults = await checkMultipleDomains(domainList);

        // Update domain statuses
        const reportEntries: DomainReportEntry[] = [];
        let amanCount = 0;
        let diblokirCount = 0;

        for (let i = 0; i < domains.length; i++) {
          const domain = domains[i];
          const checkResult = checkResults[i];

          const oldStatus = domain.status;
          const newStatus = checkResult.status;

          // Update domain status
          await DomainDatabase.updateDomainStatus(
            domain.id,
            newStatus,
            checkResult.error
          );

          // Track counts
          if (newStatus === 'AMAN') amanCount++;
          if (newStatus === 'DIBLOKIR') diblokirCount++;

          // Add to report
          reportEntries.push({
            domain: domain.domain,
            status: newStatus,
            changedSinceLastReport: oldStatus !== newStatus,
          });

          // Send alert if newly blocked
          if (oldStatus === 'AMAN' && newStatus === 'DIBLOKIR') {
            await sendBlockedAlert(user.botConfig.telegramChatId, domain.domain);
          }
        }

        // Create monitoring report
        const report: MonitoringReport = {
          id: `report_${Date.now()}_${user.id}`,
          userId: user.id,
          reportDate: new Date().toISOString(),
          totalDomains: domains.length,
          amanCount,
          diblokirCount,
          errorCount: reportEntries.filter((e) => e.status === 'ERROR').length,
          domains: reportEntries,
          sentToTelegram: false,
        };

        // Send report to Telegram
        const sendResult = await sendMonitoringReport(
          user.botConfig.telegramChatId,
          report
        );

        if (sendResult.success) {
          report.sentToTelegram = true;
          report.sentAt = new Date().toISOString();
          console.log(`Report sent successfully to user ${user.username}`);
        } else {
          console.error(`Failed to send report to user ${user.username}:`, sendResult.error);
        }

        results.push({
          userId: user.id,
          username: user.username,
          domainsChecked: domains.length,
          reportSent: sendResult.success,
          report,
        });
      } catch (userError) {
        console.error(`Error processing user ${user.username}:`, userError);
        results.push({
          userId: user.id,
          username: user.username,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoring check completed',
      timestamp: new Date().toISOString(),
      usersProcessed: activeUsers.length,
      results,
    });
  } catch (error) {
    console.error('Monitoring check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
