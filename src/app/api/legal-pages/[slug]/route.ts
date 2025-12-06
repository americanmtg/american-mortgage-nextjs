import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - fetch a single legal page by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const page = await prisma.legal_pages.findUnique({
      where: { slug },
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Legal page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch legal page' },
      { status: 500 }
    );
  }
}
