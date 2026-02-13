import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory user storage (in production, use a proper database)
const users = new Map<string, { id: string; name: string; email: string; password: string; createdAt: Date }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Try to find existing user
    let user = users.get(email);

    if (!user) {
      // Create new user (auto-register on first login)
      user = {
        id: crypto.randomUUID(),
        name: email.split('@')[0],
        email,
        password,
        createdAt: new Date(),
      };
      users.set(email, user);
      console.log('Created new user:', user.email);
    } else {
      // Verify password
      if (user.password !== password) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        );
      }
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
