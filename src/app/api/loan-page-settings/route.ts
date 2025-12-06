import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET - fetch page settings (public)
export async function GET() {
  try {
    let settings = await prisma.loan_page_settings.findFirst({
      where: { id: 1 },
    });

    // Create default if not exists
    if (!settings) {
      settings = await prisma.loan_page_settings.create({
        data: { id: 1 },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching loan page settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - update page settings
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      hero_title,
      hero_description,
      show_jump_pills,
      bottom_cta_title,
      bottom_cta_description,
    } = body;

    const settings = await prisma.loan_page_settings.upsert({
      where: { id: 1 },
      update: {
        hero_title,
        hero_description,
        show_jump_pills,
        bottom_cta_title,
        bottom_cta_description,
        updated_at: new Date(),
      },
      create: {
        id: 1,
        hero_title,
        hero_description,
        show_jump_pills,
        bottom_cta_title,
        bottom_cta_description,
      },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating loan page settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
