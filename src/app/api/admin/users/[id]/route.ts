import { NextResponse } from 'next/server';
import { getSession, getAdminUserById, updateAdminUser, deleteAdminUser } from '@/lib/auth';

// GET - Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view users
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const user = await getAdminUserById(parseInt(id));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update users
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, password } = body;

    const validRoles = ['admin', 'blog_editor'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const user = await updateAdminUser(parseInt(id), {
      name,
      email,
      role,
      password,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 400 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete users
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Cannot delete yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const success = await deleteAdminUser(userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'An error occurred deleting user' },
      { status: 500 }
    );
  }
}
