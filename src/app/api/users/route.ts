// ============================================
// API ROUTE: User Management (Admin Only)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { AdminDatabase } from '@/lib/database';
import { hashPassword } from '@/lib/auth';
import { CreateUserRequest } from '@/lib/types';

// GET all users
export async function GET(request: NextRequest) {
  try {
    const users = await AdminDatabase.getAllUsers();

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { username, password, botConfig } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await AdminDatabase.getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const newUser = await AdminDatabase.createUser({
      username,
      password: hashedPassword,
      role: 'user',
      botConfig: botConfig || {
        isActive: false,
        telegramChatId: '',
        monitoringInterval: 5,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
