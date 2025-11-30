import { NextResponse } from 'next/server';
import { getSession, getAdminUserById } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch fresh user data from database to get updated name/role
    const user = await getAdminUserById(session.userId);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'An error occurred checking session' },
      { status: 500 }
    );
  }
}
