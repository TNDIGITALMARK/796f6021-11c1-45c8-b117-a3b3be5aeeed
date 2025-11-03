// ============================================
// TRUSTPOSITIF BOT MANAGER - TYPE DEFINITIONS
// ============================================

export interface User {
  id: string;
  username: string;
  password: string; // Hashed password
  role: 'admin' | 'user';
  botConfig: BotConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BotConfig {
  isActive: boolean;
  telegramChatId: string;
  telegramGroupName?: string;
  monitoringInterval: number; // in minutes, default 5
  lastReportSent?: string;
}

export interface Domain {
  id: string;
  userId: string;
  domain: string; // without https://, e.g., "example.com"
  status: DomainStatus;
  lastChecked: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type DomainStatus = 'AMAN' | 'DIBLOKIR' | 'CHECKING' | 'ERROR';

export interface StatusHistoryEntry {
  status: DomainStatus;
  checkedAt: string;
  details?: string;
}

export interface MonitoringReport {
  id: string;
  userId: string;
  reportDate: string;
  totalDomains: number;
  amanCount: number;
  diblokirCount: number;
  errorCount: number;
  domains: DomainReportEntry[];
  sentToTelegram: boolean;
  sentAt?: string;
}

export interface DomainReportEntry {
  domain: string;
  status: DomainStatus;
  changedSinceLastReport: boolean;
}

export interface TrustPositifCheckResult {
  domain: string;
  status: DomainStatus;
  checkedAt: string;
  rawResponse?: string;
  error?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDomains: number;
  diblokirDomains: number;
  reportsToday: number;
}

export interface UserStats {
  totalDomains: number;
  amanDomains: number;
  diblokirDomains: number;
  lastReportSent?: string;
  nextScheduledCheck?: string;
}

// Google Sheets data structure
export interface AdminSheetRow {
  user_id: string;
  username: string;
  password_hash: string;
  created_date: string;
  bot_config: string; // JSON string
}

export interface UserSheetRow {
  domain_id: string;
  user_id: string;
  domain: string;
  status: DomainStatus;
  last_checked: string;
  telegram_chat_id: string;
  status_history: string; // JSON string
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  botConfig: BotConfig;
}

export interface AddDomainRequest {
  domain: string;
}

export interface UpdateBotConfigRequest {
  telegramChatId: string;
  telegramGroupName?: string;
  monitoringInterval?: number;
}
