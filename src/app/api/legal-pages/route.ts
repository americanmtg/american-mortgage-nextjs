import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// GET - fetch all legal pages
export async function GET() {
  try {
    const pages = await prisma.legal_pages.findMany({
      orderBy: { slug: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch legal pages' },
      { status: 500 }
    );
  }
}

// PUT - update a legal page
export async function PUT(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { slug, title, meta_description, content, contact_company, contact_nmls_id, contact_address, contact_email, contact_phone, contact_website } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    const page = await prisma.legal_pages.update({
      where: { slug },
      data: {
        title,
        meta_description,
        content,
        contact_company,
        contact_nmls_id,
        contact_address,
        contact_email,
        contact_phone,
        contact_website,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error updating legal page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update legal page' },
      { status: 500 }
    );
  }
}
