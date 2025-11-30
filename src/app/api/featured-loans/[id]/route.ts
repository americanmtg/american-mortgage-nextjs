import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get single featured loan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const loanId = parseInt(id)
    if (isNaN(loanId)) {
      return errorResponse('Invalid loan ID', 400)
    }

    const loan = await prisma.featured_loans.findUnique({
      where: { id: loanId },
      include: {
        featured_loans_features: {
          orderBy: { order: 'asc' },
        },
        media: true,
      },
    })

    if (!loan) {
      return errorResponse('Featured loan not found', 404)
    }

    return successResponse({
      id: loan.id,
      title: loan.title,
      subtitle: loan.subtitle,
      description: loan.description,
      icon: loan.icon,
      imageId: loan.image_id,
      image: loan.media ? {
        id: loan.media.id,
        url: loan.media.url,
        filename: loan.media.filename,
      } : null,
      linkUrl: loan.link_url,
      linkText: loan.link_text,
      order: loan.order ? Number(loan.order) : 0,
      isActive: loan.is_active,
      features: loan.featured_loans_features.map(f => ({
        id: f.id,
        text: f.text,
      })),
      updatedAt: loan.updated_at,
      createdAt: loan.created_at,
    })
  } catch (error) {
    console.error('Error fetching featured loan:', error)
    return errorResponse('Failed to fetch featured loan')
  }
}

// PATCH - Update featured loan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const loanId = parseInt(id)
    if (isNaN(loanId)) {
      return errorResponse('Invalid loan ID', 400)
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      icon,
      imageId,
      linkUrl,
      linkText,
      order,
      isActive,
      features,
    } = body

    // Validate icon enum if provided
    if (icon) {
      const validIcons = ['home', 'building', 'refresh', 'shield', 'star', 'dollar', 'chart', 'key']
      if (!validIcons.includes(icon)) {
        return errorResponse(`Invalid icon. Must be one of: ${validIcons.join(', ')}`, 400)
      }
    }

    const loan = await prisma.featured_loans.update({
      where: { id: loanId },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(imageId !== undefined && { image_id: imageId }),
        ...(linkUrl !== undefined && { link_url: linkUrl }),
        ...(linkText !== undefined && { link_text: linkText }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { is_active: isActive }),
        updated_at: new Date(),
      },
      include: {
        featured_loans_features: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Update features if provided
    if (features !== undefined) {
      // Delete existing features
      await prisma.featured_loans_features.deleteMany({
        where: { parent_id: loanId },
      })

      // Create new features
      if (features.length > 0) {
        await prisma.featured_loans_features.createMany({
          data: features.map((f: { text: string }, index: number) => ({
            id: uuidv4(),
            parent_id: loanId,
            text: f.text,
            order: index,
          })),
        })
      }

      // Refetch to get updated features
      const updatedLoan = await prisma.featured_loans.findUnique({
        where: { id: loanId },
        include: {
          featured_loans_features: {
            orderBy: { order: 'asc' },
          },
        },
      })

      return successResponse({
        id: updatedLoan!.id,
        title: updatedLoan!.title,
        subtitle: updatedLoan!.subtitle,
        description: updatedLoan!.description,
        icon: updatedLoan!.icon,
        linkUrl: updatedLoan!.link_url,
        linkText: updatedLoan!.link_text,
        order: updatedLoan!.order ? Number(updatedLoan!.order) : 0,
        isActive: updatedLoan!.is_active,
        features: updatedLoan!.featured_loans_features.map(f => ({
          id: f.id,
          text: f.text,
        })),
        updatedAt: updatedLoan!.updated_at,
      })
    }

    return successResponse({
      id: loan.id,
      title: loan.title,
      subtitle: loan.subtitle,
      description: loan.description,
      icon: loan.icon,
      linkUrl: loan.link_url,
      linkText: loan.link_text,
      order: loan.order ? Number(loan.order) : 0,
      isActive: loan.is_active,
      features: loan.featured_loans_features.map(f => ({
        id: f.id,
        text: f.text,
      })),
      updatedAt: loan.updated_at,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Featured loan not found', 404)
    }
    console.error('Error updating featured loan:', error)
    return errorResponse('Failed to update featured loan')
  }
}

// DELETE - Delete featured loan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const loanId = parseInt(id)
    if (isNaN(loanId)) {
      return errorResponse('Invalid loan ID', 400)
    }

    await prisma.featured_loans.delete({
      where: { id: loanId },
    })

    return successResponse({ success: true, deletedId: loanId })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Featured loan not found', 404)
    }
    console.error('Error deleting featured loan:', error)
    return errorResponse('Failed to delete featured loan')
  }
}
