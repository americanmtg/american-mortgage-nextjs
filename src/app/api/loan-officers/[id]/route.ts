import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get single loan officer (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const officerId = parseInt(id, 10)

    if (isNaN(officerId)) {
      return errorResponse('Invalid officer ID', 400)
    }

    const officer = await prisma.loan_officers.findUnique({
      where: { id: officerId },
    })

    if (!officer) {
      return errorResponse('Loan officer not found', 404)
    }

    return successResponse({
      id: officer.id,
      name: officer.name,
      phone: officer.phone,
      email: officer.email,
      isActive: officer.is_active,
      updatedAt: officer.updated_at,
      createdAt: officer.created_at,
    })
  } catch (error) {
    console.error('Error fetching loan officer:', error)
    return errorResponse('Failed to fetch loan officer')
  }
}

// PUT - Update loan officer (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const officerId = parseInt(id, 10)

    if (isNaN(officerId)) {
      return errorResponse('Invalid officer ID', 400)
    }

    const existing = await prisma.loan_officers.findUnique({
      where: { id: officerId },
    })

    if (!existing) {
      return errorResponse('Loan officer not found', 404)
    }

    const body = await request.json()
    const { name, phone, email, isActive } = body

    const officer = await prisma.loan_officers.update({
      where: { id: officerId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { is_active: isActive }),
        updated_at: new Date(),
      },
    })

    return successResponse({
      id: officer.id,
      name: officer.name,
      phone: officer.phone,
      email: officer.email,
      isActive: officer.is_active,
      updatedAt: officer.updated_at,
      createdAt: officer.created_at,
    })
  } catch (error) {
    console.error('Error updating loan officer:', error)
    return errorResponse('Failed to update loan officer')
  }
}

// DELETE - Delete loan officer (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const officerId = parseInt(id, 10)

    if (isNaN(officerId)) {
      return errorResponse('Invalid officer ID', 400)
    }

    const existing = await prisma.loan_officers.findUnique({
      where: { id: officerId },
    })

    if (!existing) {
      return errorResponse('Loan officer not found', 404)
    }

    await prisma.loan_officers.delete({
      where: { id: officerId },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting loan officer:', error)
    return errorResponse('Failed to delete loan officer')
  }
}
