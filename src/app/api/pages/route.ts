import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List all pages
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [pages, total] = await Promise.all([
      prisma.pages.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pages.count(),
    ])

    const items = pages.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      subtitle: p.subtitle,
      template: p.template,
      content: p.content,
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      heroImageId: p.hero_image_id,
      sidebarTitle: p.sidebar_title,
      sidebarContent: p.sidebar_content,
      ctaTitle: p.cta_title,
      ctaButtonText: p.cta_button_text,
      ctaButtonLink: p.cta_button_link,
      updatedAt: p.updated_at,
      createdAt: p.created_at,
    }))

    return successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return errorResponse('Failed to fetch pages')
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      title,
      slug,
      subtitle,
      template,
      content,
      metaTitle,
      metaDescription,
      heroImageId,
      sidebarTitle,
      sidebarContent,
      ctaTitle,
      ctaButtonText,
      ctaButtonLink,
    } = body

    if (!title || !slug) {
      return errorResponse('Title and slug are required', 400)
    }

    // Check if slug already exists
    const existing = await prisma.pages.findUnique({
      where: { slug },
    })
    if (existing) {
      return errorResponse('A page with this slug already exists', 400)
    }

    const page = await prisma.pages.create({
      data: {
        title,
        slug,
        subtitle: subtitle || null,
        template: template || 'default',
        content: content || null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        hero_image_id: heroImageId || null,
        sidebar_title: sidebarTitle || null,
        sidebar_content: sidebarContent || null,
        cta_title: ctaTitle || null,
        cta_button_text: ctaButtonText || null,
        cta_button_link: ctaButtonLink || null,
      },
    })

    return successResponse({
      id: page.id,
      title: page.title,
      slug: page.slug,
      subtitle: page.subtitle,
      template: page.template,
      content: page.content,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      createdAt: page.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating page:', error)
    return errorResponse('Failed to create page')
  }
}
