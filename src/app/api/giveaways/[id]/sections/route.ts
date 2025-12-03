import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get all sections for a giveaway
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const sections = await prisma.giveaway_sections.findMany({
      where: { giveaway_id: giveawayId },
      orderBy: { section_order: 'asc' },
    })

    return successResponse(sections.map(s => ({
      id: s.id,
      title: s.title,
      content: s.content,
      order: s.section_order,
      isExpanded: s.is_expanded,
    })))
  } catch (error) {
    console.error('Error fetching sections:', error)
    return errorResponse('Failed to fetch sections')
  }
}

// POST - Create a new section
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can create sections', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    // Verify giveaway exists
    const giveaway = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
    })

    if (!giveaway) {
      return errorResponse('Giveaway not found', 404)
    }

    const body = await request.json()
    const { title, content, order, isExpanded } = body

    if (!title) {
      return errorResponse('Title is required', 400)
    }

    // Get max order if not provided
    let sectionOrder = order
    if (sectionOrder === undefined) {
      const maxOrder = await prisma.giveaway_sections.findFirst({
        where: { giveaway_id: giveawayId },
        orderBy: { section_order: 'desc' },
        select: { section_order: true },
      })
      sectionOrder = (maxOrder?.section_order ?? -1) + 1
    }

    const section = await prisma.giveaway_sections.create({
      data: {
        giveaway_id: giveawayId,
        title,
        content: content || '',
        section_order: sectionOrder,
        is_expanded: isExpanded || false,
      },
    })

    return successResponse({
      id: section.id,
      title: section.title,
      content: section.content,
      order: section.section_order,
      isExpanded: section.is_expanded,
    })
  } catch (error) {
    console.error('Error creating section:', error)
    return errorResponse('Failed to create section')
  }
}

// PUT - Update all sections (bulk update for reordering)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can update sections', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const body = await request.json()
    const { sections } = body

    if (!Array.isArray(sections)) {
      return errorResponse('Sections must be an array', 400)
    }

    // Update each section
    for (const section of sections) {
      if (section.id) {
        await prisma.giveaway_sections.update({
          where: { id: section.id },
          data: {
            title: section.title,
            content: section.content,
            section_order: section.order,
            is_expanded: section.isExpanded,
            updated_at: new Date(),
          },
        })
      }
    }

    // Fetch updated sections
    const updatedSections = await prisma.giveaway_sections.findMany({
      where: { giveaway_id: giveawayId },
      orderBy: { section_order: 'asc' },
    })

    return successResponse(updatedSections.map(s => ({
      id: s.id,
      title: s.title,
      content: s.content,
      order: s.section_order,
      isExpanded: s.is_expanded,
    })))
  } catch (error) {
    console.error('Error updating sections:', error)
    return errorResponse('Failed to update sections')
  }
}

// DELETE - Delete a section (expects sectionId in query params)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can delete sections', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)
    const url = new URL(request.url)
    const sectionId = url.searchParams.get('sectionId')

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    if (!sectionId) {
      return errorResponse('Section ID is required', 400)
    }

    const sectionIdNum = parseInt(sectionId)
    if (isNaN(sectionIdNum)) {
      return errorResponse('Invalid section ID', 400)
    }

    // Verify section belongs to giveaway
    const section = await prisma.giveaway_sections.findFirst({
      where: {
        id: sectionIdNum,
        giveaway_id: giveawayId,
      },
    })

    if (!section) {
      return errorResponse('Section not found', 404)
    }

    await prisma.giveaway_sections.delete({
      where: { id: sectionIdNum },
    })

    return successResponse({ deleted: true, id: sectionIdNum })
  } catch (error) {
    console.error('Error deleting section:', error)
    return errorResponse('Failed to delete section')
  }
}
