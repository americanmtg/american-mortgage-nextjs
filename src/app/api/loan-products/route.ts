import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET - fetch all loan products (public)
export async function GET() {
  try {
    const products = await prisma.loan_products.findMany({
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching loan products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan products' },
      { status: 500 }
    );
  }
}

// POST - create a new loan product
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      name,
      tagline,
      description,
      icon_name,
      highlights,
      best_for,
      down_payment,
      credit_score,
      is_active,
      primary_button_text,
      primary_button_link,
      primary_button_style,
      secondary_button_text,
      secondary_button_link,
      secondary_button_style,
      show_secondary_button,
    } = body;

    // Get max display_order
    const maxOrder = await prisma.loan_products.aggregate({
      _max: { display_order: true },
    });
    const newOrder = (maxOrder._max.display_order || 0) + 1;

    const product = await prisma.loan_products.create({
      data: {
        name,
        tagline,
        description,
        icon_name: icon_name || 'home',
        highlights: highlights || [],
        best_for,
        down_payment,
        credit_score,
        display_order: newOrder,
        is_active: is_active ?? true,
        primary_button_text: primary_button_text || 'Apply Now',
        primary_button_link: primary_button_link || '/apply',
        primary_button_style: primary_button_style || 'filled',
        secondary_button_text: secondary_button_text || 'Call to Learn More',
        secondary_button_link: secondary_button_link || 'tel:870-926-4052',
        secondary_button_style: secondary_button_style || 'outline',
        show_secondary_button: show_secondary_button ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error creating loan product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create loan product' },
      { status: 500 }
    );
  }
}

// PUT - update loan product or reorder
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
        prisma.loan_products.update({
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
      name,
      tagline,
      description,
      icon_name,
      highlights,
      best_for,
      down_payment,
      credit_score,
      is_active,
      primary_button_text,
      primary_button_link,
      primary_button_style,
      secondary_button_text,
      secondary_button_link,
      secondary_button_style,
      show_secondary_button,
      // Article fields
      hero_image,
      article_intro,
      article_sections,
      article_requirements,
      article_faqs,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const product = await prisma.loan_products.update({
      where: { id },
      data: {
        name,
        tagline,
        description,
        icon_name,
        highlights,
        best_for,
        down_payment,
        credit_score,
        is_active,
        primary_button_text,
        primary_button_link,
        primary_button_style,
        secondary_button_text,
        secondary_button_link,
        secondary_button_style,
        show_secondary_button,
        // Article fields
        hero_image,
        article_intro,
        article_sections: article_sections || [],
        article_requirements: article_requirements || [],
        article_faqs: article_faqs || [],
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error updating loan product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update loan product' },
      { status: 500 }
    );
  }
}

// DELETE - delete a loan product
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

    await prisma.loan_products.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting loan product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete loan product' },
      { status: 500 }
    );
  }
}
