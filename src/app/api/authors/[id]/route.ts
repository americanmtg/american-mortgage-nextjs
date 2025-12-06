import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get single author (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const authorId = parseInt(id, 10)

    if (isNaN(authorId)) {
      return errorResponse('Invalid author ID', 400)
    }

    const author = await prisma.authors.findUnique({
      where: { id: authorId },
      include: { photo: true },
    })

    if (!author) {
      return errorResponse('Author not found', 404)
    }

    return successResponse({
      id: author.id,
      name: author.name,
      email: author.email,
      phone: author.phone,
      nmlsId: author.nmls_id,
      bio: author.bio,
      photoId: author.photo_id,
      photoUrl: author.photo?.url || null,
      isActive: author.is_active,
      updatedAt: author.updated_at,
      createdAt: author.created_at,
    })
  } catch (error) {
    console.error('Error fetching author:', error)
    return errorResponse('Failed to fetch author')
  }
}

// PUT - Update author (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const authorId = parseInt(id, 10)

    if (isNaN(authorId)) {
      return errorResponse('Invalid author ID', 400)
    }

    const existing = await prisma.authors.findUnique({
      where: { id: authorId },
    })

    if (!existing) {
      return errorResponse('Author not found', 404)
    }

    const body = await request.json()
    const { name, email, phone, nmlsId, bio, isActive, photoId } = body

    const author = await prisma.authors.update({
      where: { id: authorId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(nmlsId !== undefined && { nmls_id: nmlsId || null }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(isActive !== undefined && { is_active: isActive }),
        ...(photoId !== undefined && { photo_id: photoId || null }),
        updated_at: new Date(),
      },
      include: { photo: true },
    })

    return successResponse({
      id: author.id,
      name: author.name,
      email: author.email,
      phone: author.phone,
      nmlsId: author.nmls_id,
      bio: author.bio,
      photoId: author.photo_id,
      photoUrl: author.photo?.url || null,
      isActive: author.is_active,
      updatedAt: author.updated_at,
      createdAt: author.created_at,
    })
  } catch (error) {
    console.error('Error updating author:', error)
    return errorResponse('Failed to update author')
  }
}

// DELETE - Delete author (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const authorId = parseInt(id, 10)

    if (isNaN(authorId)) {
      return errorResponse('Invalid author ID', 400)
    }

    const existing = await prisma.authors.findUnique({
      where: { id: authorId },
    })

    if (!existing) {
      return errorResponse('Author not found', 404)
    }

    await prisma.authors.delete({
      where: { id: authorId },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting author:', error)
    return errorResponse('Failed to delete author')
  }
}
