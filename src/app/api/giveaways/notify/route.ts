import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Subscribe to giveaway notifications
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.giveaway_notification_subscribers.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({
          success: true,
          message: "You're already subscribed!",
        });
      } else {
        // Reactivate subscription
        await prisma.giveaway_notification_subscribers.update({
          where: { email: email.toLowerCase() },
          data: { is_active: true, subscribed_at: new Date() },
        });
        return NextResponse.json({
          success: true,
          message: "Welcome back! You're subscribed again.",
        });
      }
    }

    // Create new subscription
    await prisma.giveaway_notification_subscribers.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
