import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List all lender logos (public for active, all for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const [logos, settings] = await Promise.all([
      prisma.lender_logos.findMany({
        where: activeOnly ? { is_active: true } : undefined,
        orderBy: { display_order: 'asc' },
        include: {
          media: true,
        },
      }),
      prisma.lender_logos_settings.findFirst({
        where: { id: 1 },
      }),
    ])

    const items = logos.map(logo => ({
      id: logo.id,
      name: logo.name,
      logoUrl: logo.logo_url || (logo.media ? logo.media.url : null),
      mediaId: logo.media_id,
      width: logo.width,
      height: logo.height,
      displayOrder: logo.display_order,
      isActive: logo.is_active,
      createdAt: logo.created_at,
      updatedAt: logo.updated_at,
    }))

    return successResponse({
      items,
      settings: {
        sectionTitle: settings?.section_title || 'Trusted Lender Partners',
      }
    })
  } catch (error) {
    console.error('Error fetching lender logos:', error)
    return errorResponse('Failed to fetch lender logos')
  }
}

// POST - Create new lender logo (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { name, logoUrl, mediaId, width, height, displayOrder, isActive } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    const logo = await prisma.lender_logos.create({
      data: {
        name,
        logo_url: logoUrl || null,
        media_id: mediaId || null,
        width: width ?? 120,
        height: height ?? 40,
        display_order: displayOrder ?? 0,
        is_active: isActive ?? true,
      },
      include: {
        media: true,
      },
    })

    return successResponse({
      id: logo.id,
      name: logo.name,
      logoUrl: logo.logo_url || (logo.media ? logo.media.url : null),
      mediaId: logo.media_id,
      width: logo.width,
      height: logo.height,
      displayOrder: logo.display_order,
      isActive: logo.is_active,
      createdAt: logo.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating lender logo:', error)
    return errorResponse('Failed to create lender logo')
  }
}

// PUT - Update lender logo (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { id, name, logoUrl, mediaId, width, height, displayOrder, isActive } = body

    if (!id) {
      return errorResponse('ID is required', 400)
    }

    const logo = await prisma.lender_logos.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        logo_url: logoUrl !== undefined ? logoUrl : undefined,
        media_id: mediaId !== undefined ? mediaId : undefined,
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        display_order: displayOrder !== undefined ? displayOrder : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
        updated_at: new Date(),
      },
      include: {
        media: true,
      },
    })

    return successResponse({
      id: logo.id,
      name: logo.name,
      logoUrl: logo.logo_url || (logo.media ? logo.media.url : null),
      mediaId: logo.media_id,
      width: logo.width,
      height: logo.height,
      displayOrder: logo.display_order,
      isActive: logo.is_active,
      updatedAt: logo.updated_at,
    })
  } catch (error) {
    console.error('Error updating lender logo:', error)
    return errorResponse('Failed to update lender logo')
  }
}

// DELETE - Delete lender logo (admin only)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return errorResponse('ID is required', 400)
    }

    await prisma.lender_logos.delete({
      where: { id: parseInt(id) },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting lender logo:', error)
    return errorResponse('Failed to delete lender logo')
  }
}

// PATCH - Update settings (admin only)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { sectionTitle } = body

    const settings = await prisma.lender_logos_settings.upsert({
      where: { id: 1 },
      update: {
        section_title: sectionTitle,
        updated_at: new Date(),
      },
      create: {
        id: 1,
        section_title: sectionTitle,
      },
    })

    return successResponse({
      sectionTitle: settings.section_title,
    })
  } catch (error) {
    console.error('Error updating lender logos settings:', error)
    return errorResponse('Failed to update settings')
  }
}
