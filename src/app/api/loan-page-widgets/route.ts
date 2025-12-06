import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET - fetch all widgets (public)
export async function GET() {
  try {
    const widgets = await prisma.loan_page_widgets.findMany({
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: widgets,
    });
  } catch (error) {
    console.error('Error fetching loan page widgets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch widgets' },
      { status: 500 }
    );
  }
}

// POST - create a new widget
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      widget_type,
      title,
      description,
      button_text,
      button_link,
      icon_name,
      icon_color,
      partner_name,
      partner_company,
      partner_email,
      partner_phone,
      show_on_mobile,
      show_on_desktop,
      is_active,
    } = body;

    // Get max display_order
    const maxOrder = await prisma.loan_page_widgets.aggregate({
      _max: { display_order: true },
    });
    const newOrder = (maxOrder._max.display_order || 0) + 1;

    const widget = await prisma.loan_page_widgets.create({
      data: {
        widget_type,
        title,
        description,
        button_text,
        button_link,
        icon_name,
        icon_color,
        partner_name,
        partner_company,
        partner_email,
        partner_phone,
        display_order: newOrder,
        show_on_mobile: show_on_mobile ?? true,
        show_on_desktop: show_on_desktop ?? true,
        is_active: is_active ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: widget,
    });
  } catch (error) {
    console.error('Error creating widget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create widget' },
      { status: 500 }
    );
  }
}

// PUT - update widget or reorder
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Handle reorder
    if (body.reorder && Array.isArray(body.items)) {
      const updates = body.items.map((item: { id: number; display_order: number }) =>
        prisma.loan_page_widgets.update({
          where: { id: item.id },
          data: { display_order: item.display_order, updated_at: new Date() },
        })
      );
      await prisma.$transaction(updates);

      return NextResponse.json({ success: true });
    }

    // Handle single update
    const {
      id,
      widget_type,
      title,
      description,
      button_text,
      button_link,
      icon_name,
      icon_color,
      partner_name,
      partner_company,
      partner_email,
      partner_phone,
      show_on_mobile,
      show_on_desktop,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const widget = await prisma.loan_page_widgets.update({
      where: { id },
      data: {
        widget_type,
        title,
        description,
        button_text,
        button_link,
        icon_name,
        icon_color,
        partner_name,
        partner_company,
        partner_email,
        partner_phone,
        show_on_mobile,
        show_on_desktop,
        is_active,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: widget,
    });
  } catch (error) {
    console.error('Error updating widget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update widget' },
      { status: 500 }
    );
  }
}

// DELETE - delete a widget
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.loan_page_widgets.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete widget' },
      { status: 500 }
    );
  }
}
