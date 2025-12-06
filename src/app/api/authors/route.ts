import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all authors (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const authors = await prisma.authors.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
      include: { photo: true },
    })

    const items = authors.map(author => ({
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
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching authors:', error)
    return errorResponse('Failed to fetch authors')
  }
}

// POST - Create new author (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { name, email, phone, nmlsId, bio, isActive, photoId } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    const author = await prisma.authors.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        nmls_id: nmlsId || null,
        bio: bio || null,
        is_active: isActive ?? true,
        photo_id: photoId || null,
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
      createdAt: author.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating author:', error)
    return errorResponse('Failed to create author')
  }
}
