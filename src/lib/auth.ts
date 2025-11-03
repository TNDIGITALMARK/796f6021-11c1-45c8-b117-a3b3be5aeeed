// ============================================
// AUTHENTICATION UTILITIES
// ============================================

import { User } from './types';

const AUTH_TOKEN_KEY = 'trustpositif_auth_token';
const USER_DATA_KEY = 'trustpositif_user_data';

export function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  // For MVP, using simple hash (replace with proper hashing)
  return btoa(password);
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }
}

export function setUserData(user: Omit<User, 'password'>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }
}

export function getUserData(): Omit<User, 'password'> | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function generateToken(userId: string): string {
  // In production, use JWT with proper signing
  // For MVP, simple token generation
  const timestamp = Date.now();
  return btoa(`${userId}:${timestamp}`);
}

export function validateToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const [userId, timestamp] = decoded.split(':');
    // Check if token is not older than 24 hours
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Boolean(userId && tokenAge < maxAge);
  } catch {
    return false;
  }
}

export function logout(): void {
  removeAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
