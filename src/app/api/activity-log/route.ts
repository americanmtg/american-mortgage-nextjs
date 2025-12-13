import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import prisma from '@/lib/prisma';

// GET - List activity logs (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const channel = searchParams.get('channel') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.notification_type = type;
    }

    // Get total count
    const total = await prisma.notifications_log.count({ where });

    // Get paginated results
    const logs = await prisma.notifications_log.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        notification_type: true,
        channel: true,
        recipient: true,
        subject: true,
        status: true,
        error_message: true,
        sent_at: true,
        created_at: true,
        external_id: true,
      },
    });

    return NextResponse.json({
      data: logs.map(log => ({
        id: log.id,
        type: log.notification_type,
        channel: log.channel,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        errorMessage: log.error_message,
        sentAt: log.sent_at,
        createdAt: log.created_at,
        externalId: log.external_id,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
