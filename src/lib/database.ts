// ============================================
// DATABASE SERVICE - Mock Implementation
// In production, replace with actual Google Sheets API
// ============================================

import { User, Domain, AdminSheetRow, UserSheetRow, BotConfig, DomainStatus } from './types';

// Mock data storage (in-memory for MVP)
// In production, replace with Google Sheets API calls
let adminData: User[] = [
  {
    id: 'admin_001',
    username: 'admin',
    password: btoa('admin123'), // hashed password
    role: 'admin',
    botConfig: {
      isActive: true,
      telegramChatId: '',
      monitoringInterval: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let userData: Domain[] = [
  {
    id: 'domain_001',
    userId: 'user_001',
    domain: 'example.com',
    status: 'AMAN',
    lastChecked: new Date().toISOString(),
    statusHistory: [
      {
        status: 'AMAN',
        checkedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'domain_002',
    userId: 'user_001',
    domain: 'testsite.id',
    status: 'DIBLOKIR',
    lastChecked: new Date().toISOString(),
    statusHistory: [
      {
        status: 'DIBLOKIR',
        checkedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Admin database operations
export const AdminDatabase = {
  async getAllUsers(): Promise<User[]> {
    return adminData;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    return adminData.find((u) => u.username === username) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    return adminData.find((u) => u.id === id) || null;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    adminData.push(newUser);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = adminData.findIndex((u) => u.id === id);
    if (index === -1) return null;

    adminData[index] = {
      ...adminData[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return adminData[index];
  },

  async deleteUser(id: string): Promise<boolean> {
    const index = adminData.findIndex((u) => u.id === id);
    if (index === -1) return false;

    adminData.splice(index, 1);
    return true;
  },
};

// User domain database operations
export const DomainDatabase = {
  async getDomainsByUserId(userId: string): Promise<Domain[]> {
    return userData.filter((d) => d.userId === userId);
  },

  async getDomainById(id: string): Promise<Domain | null> {
    return userData.find((d) => d.id === id) || null;
  },

  async getAllDomains(): Promise<Domain[]> {
    return userData;
  },

  async createDomain(domainData: Omit<Domain, 'id' | 'createdAt' | 'updatedAt'>): Promise<Domain> {
    const newDomain: Domain = {
      ...domainData,
      id: `domain_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    userData.push(newDomain);
    return newDomain;
  },

  async updateDomain(id: string, updates: Partial<Domain>): Promise<Domain | null> {
    const index = userData.findIndex((d) => d.id === id);
    if (index === -1) return null;

    userData[index] = {
      ...userData[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return userData[index];
  },

  async updateDomainStatus(
    id: string,
    status: DomainStatus,
    details?: string
  ): Promise<Domain | null> {
    const domain = await this.getDomainById(id);
    if (!domain) return null;

    const historyEntry = {
      status,
      checkedAt: new Date().toISOString(),
      details,
    };

    return this.updateDomain(id, {
      status,
      lastChecked: new Date().toISOString(),
      statusHistory: [...domain.statusHistory, historyEntry],
    });
  },

  async deleteDomain(id: string): Promise<boolean> {
    const index = userData.findIndex((d) => d.id === id);
    if (index === -1) return false;

    userData.splice(index, 1);
    return true;
  },
};

// Helper function to initialize default data
export function initializeDatabase() {
  // Ensure at least one admin user exists
  if (adminData.length === 0) {
    adminData.push({
      id: 'admin_001',
      username: 'admin',
      password: btoa('admin123'),
      role: 'admin',
      botConfig: {
        isActive: true,
        telegramChatId: '',
        monitoringInterval: 5,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
