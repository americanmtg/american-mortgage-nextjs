import { NextResponse } from 'next/server';
import { getSession, getAdminUsers, createAdminUser } from '@/lib/auth';

// GET - List all admin users
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view users
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getAdminUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching users' },
      { status: 500 }
    );
  }
}

// POST - Create new admin user
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create users
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const validRoles = ['admin', 'blog_editor'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const user = await createAdminUser(email, password, name, role || 'admin');

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user. Email may already exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'An error occurred creating user' },
      { status: 500 }
    );
  }
}
