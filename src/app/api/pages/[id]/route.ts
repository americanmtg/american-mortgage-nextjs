import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const pageId = parseInt(id)
    if (isNaN(pageId)) {
      return errorResponse('Invalid page ID', 400)
    }

    const page = await prisma.pages.findUnique({
      where: { id: pageId },
    })

    if (!page) {
      return errorResponse('Page not found', 404)
    }

    return successResponse({
      id: page.id,
      title: page.title,
      slug: page.slug,
      subtitle: page.subtitle,
      template: page.template,
      content: page.content,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
      heroImageId: page.hero_image_id,
      sidebarTitle: page.sidebar_title,
      sidebarContent: page.sidebar_content,
      ctaTitle: page.cta_title,
      ctaButtonText: page.cta_button_text,
      ctaButtonLink: page.cta_button_link,
      updatedAt: page.updated_at,
      createdAt: page.created_at,
    })
  } catch (error) {
    console.error('Error fetching page:', error)
    return errorResponse('Failed to fetch page')
  }
}

// PATCH - Update page
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const pageId = parseInt(id)
    if (isNaN(pageId)) {
      return errorResponse('Invalid page ID', 400)
    }

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

    // Check if new slug conflicts with existing page
    if (slug) {
      const existing = await prisma.pages.findFirst({
        where: {
          slug,
          NOT: { id: pageId },
        },
      })
      if (existing) {
        return errorResponse('A page with this slug already exists', 400)
      }
    }

    const page = await prisma.pages.update({
      where: { id: pageId },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(subtitle !== undefined && { subtitle }),
        ...(template !== undefined && { template }),
        ...(content !== undefined && { content }),
        ...(metaTitle !== undefined && { meta_title: metaTitle }),
        ...(metaDescription !== undefined && { meta_description: metaDescription }),
        ...(heroImageId !== undefined && { hero_image_id: heroImageId }),
        ...(sidebarTitle !== undefined && { sidebar_title: sidebarTitle }),
        ...(sidebarContent !== undefined && { sidebar_content: sidebarContent }),
        ...(ctaTitle !== undefined && { cta_title: ctaTitle }),
        ...(ctaButtonText !== undefined && { cta_button_text: ctaButtonText }),
        ...(ctaButtonLink !== undefined && { cta_button_link: ctaButtonLink }),
        updated_at: new Date(),
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
      updatedAt: page.updated_at,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Page not found', 404)
    }
    console.error('Error updating page:', error)
    return errorResponse('Failed to update page')
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const pageId = parseInt(id)
    if (isNaN(pageId)) {
      return errorResponse('Invalid page ID', 400)
    }

    await prisma.pages.delete({
      where: { id: pageId },
    })

    return successResponse({ success: true, deletedId: pageId })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Page not found', 404)
    }
    console.error('Error deleting page:', error)
    return errorResponse('Failed to delete page')
  }
}
