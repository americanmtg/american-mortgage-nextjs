import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all loan officers (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const officers = await prisma.loan_officers.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
      include: { photo: true },
    })

    const items = officers.map(officer => ({
      id: officer.id,
      name: officer.name,
      nmlsId: officer.nmls_id,
      phone: officer.phone,
      email: officer.email,
      photoId: officer.photo_id,
      photoUrl: officer.photo?.url || null,
      isActive: officer.is_active,
      updatedAt: officer.updated_at,
      createdAt: officer.created_at,
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching loan officers:', error)
    return errorResponse('Failed to fetch loan officers')
  }
}

// POST - Create new loan officer (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { name, nmlsId, phone, email, isActive, photoId } = body

    if (!name) {
      return errorResponse('Name is required', 400)
    }

    if (!phone) {
      return errorResponse('Phone is required', 400)
    }

    if (!email) {
      return errorResponse('Email is required', 400)
    }

    const officer = await prisma.loan_officers.create({
      data: {
        name,
        nmls_id: nmlsId || null,
        phone,
        email,
        is_active: isActive ?? true,
        photo_id: photoId || null,
      },
      include: { photo: true },
    })

    return successResponse({
      id: officer.id,
      name: officer.name,
      nmlsId: officer.nmls_id,
      phone: officer.phone,
      email: officer.email,
      photoId: officer.photo_id,
      photoUrl: officer.photo?.url || null,
      isActive: officer.is_active,
      createdAt: officer.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating loan officer:', error)
    return errorResponse('Failed to create loan officer')
  }
}
