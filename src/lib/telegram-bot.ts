// ============================================
// TELEGRAM BOT SERVICE
// Sends monitoring reports to Telegram groups
// ============================================

import { MonitoringReport, DomainReportEntry } from './types';

const BOT_TOKEN = '7760727060:AAGGwhPNVMcmnhHsXttlhNfx-4vAinCshWo';
const BOT_USERNAME = '@crozxy_ceknawala_bot';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Sends a message to a Telegram chat
 * @param chatId Telegram chat ID
 * @param message Message text
 * @returns Success status
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.description || 'Failed to send message',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Formats monitoring report for Telegram
 * @param report Monitoring report data
 * @returns Formatted message
 */
export function formatMonitoringReport(report: MonitoringReport): string {
  const { reportDate, totalDomains, amanCount, diblokirCount, domains } = report;

  // Format date
  const date = new Date(reportDate);
  const formattedDate = date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Build message header
  let message = `<b>📊 LAPORAN MONITORING - ${formattedDate}</b>\n\n`;
  message += `<b>Total Domain:</b> ${totalDomains}\n`;
  message += `✅ <b>Domain Aman:</b> ${amanCount}\n`;
  message += `🚫 <b>Domain Diblokir:</b> ${diblokirCount}\n\n`;

  // Add domain details
  if (domains.length > 0) {
    message += `<b>Detail Status:</b>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;

    domains.forEach((domain) => {
      const statusEmoji = domain.status === 'AMAN' ? '✅' : '🚫';
      const changedIndicator = domain.changedSinceLastReport ? ' ⚠️ BERUBAH' : '';
      message += `${statusEmoji} <code>${domain.domain}</code> - <b>${domain.status}</b>${changedIndicator}\n`;
    });
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🤖 Bot: ${BOT_USERNAME}\n`;
  message += `⏰ Update setiap 5 menit`;

  return message;
}

/**
 * Sends monitoring report to Telegram group
 * @param chatId Telegram chat ID
 * @param report Monitoring report
 * @returns Success status
 */
export async function sendMonitoringReport(
  chatId: string,
  report: MonitoringReport
): Promise<{ success: boolean; error?: string }> {
  const message = formatMonitoringReport(report);
  return sendTelegramMessage(chatId, message);
}

/**
 * Sends alert for newly blocked domain
 * @param chatId Telegram chat ID
 * @param domain Domain that got blocked
 * @returns Success status
 */
export async function sendBlockedAlert(
  chatId: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const message = `
🚨 <b>ALERT: DOMAIN DIBLOKIR</b>

Domain <code>${domain}</code> telah terdeteksi DIBLOKIR oleh TrustPositif!

⏰ ${new Date().toLocaleString('id-ID')}
🤖 Bot: ${BOT_USERNAME}
  `.trim();

  return sendTelegramMessage(chatId, message);
}

/**
 * Validates Telegram chat ID format
 * @param chatId Chat ID to validate
 * @returns True if valid format
 */
export function isValidChatId(chatId: string): boolean {
  // Telegram chat IDs are negative numbers for groups
  // or positive numbers for users
  return /^-?\d+$/.test(chatId);
}

/**
 * Tests bot connection with a chat
 * @param chatId Telegram chat ID
 * @returns Success status and bot info
 */
export async function testBotConnection(
  chatId: string
): Promise<{ success: boolean; botInfo?: unknown; error?: string }> {
  try {
    // Get bot info
    const botInfoResponse = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const botInfo = await botInfoResponse.json();

    if (!botInfo.ok) {
      return {
        success: false,
        error: 'Invalid bot token',
      };
    }

    // Send test message
    const testMessage = `✅ Koneksi berhasil!\n\nBot ${BOT_USERNAME} telah terhubung dengan grup ini.`;
    const sendResult = await sendTelegramMessage(chatId, testMessage);

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error,
      };
    }

    return {
      success: true,
      botInfo: botInfo.result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
