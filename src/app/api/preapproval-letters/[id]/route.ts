import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get single pre-approval letter (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return errorResponse('Invalid letter ID', 400)
    }

    const letter = await prisma.preapproval_letters.findUnique({
      where: { id: letterId },
      include: {
        loan_officer: true,
      },
    })

    if (!letter) {
      return errorResponse('Pre-approval letter not found', 404)
    }

    return successResponse({
      id: letter.id,
      borrowerName: letter.borrower_name,
      letterDate: letter.letter_date,
      referenceId: letter.reference_id,
      status: letter.status,
      loanOfficerId: letter.loan_officer_id,
      loanOfficer: letter.loan_officer ? {
        id: letter.loan_officer.id,
        name: letter.loan_officer.name,
        phone: letter.loan_officer.phone,
        email: letter.loan_officer.email,
      } : null,
      notes: letter.notes,
      updatedAt: letter.updated_at,
      createdAt: letter.created_at,
    })
  } catch (error) {
    console.error('Error fetching pre-approval letter:', error)
    return errorResponse('Failed to fetch pre-approval letter')
  }
}

// PUT - Update pre-approval letter (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return errorResponse('Invalid letter ID', 400)
    }

    const existing = await prisma.preapproval_letters.findUnique({
      where: { id: letterId },
    })

    if (!existing) {
      return errorResponse('Pre-approval letter not found', 404)
    }

    const body = await request.json()
    const { borrowerName, letterDate, referenceId, status, loanOfficerId, notes } = body

    // Check if new reference ID conflicts with another letter
    if (referenceId && referenceId !== existing.reference_id) {
      const conflict = await prisma.preapproval_letters.findUnique({
        where: { reference_id: referenceId },
      })
      if (conflict) {
        return errorResponse('A letter with this reference ID already exists', 400)
      }
    }

    const validStatuses = ['authentic', 'invalid', 'expired']
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    const letter = await prisma.preapproval_letters.update({
      where: { id: letterId },
      data: {
        ...(borrowerName !== undefined && { borrower_name: borrowerName }),
        ...(letterDate !== undefined && { letter_date: new Date(letterDate) }),
        ...(referenceId !== undefined && { reference_id: referenceId }),
        ...(status !== undefined && { status }),
        ...(loanOfficerId !== undefined && { loan_officer_id: loanOfficerId || null }),
        ...(notes !== undefined && { notes: notes || null }),
        updated_at: new Date(),
      },
      include: {
        loan_officer: true,
      },
    })

    return successResponse({
      id: letter.id,
      borrowerName: letter.borrower_name,
      letterDate: letter.letter_date,
      referenceId: letter.reference_id,
      status: letter.status,
      loanOfficerId: letter.loan_officer_id,
      loanOfficer: letter.loan_officer ? {
        id: letter.loan_officer.id,
        name: letter.loan_officer.name,
        phone: letter.loan_officer.phone,
        email: letter.loan_officer.email,
      } : null,
      notes: letter.notes,
      updatedAt: letter.updated_at,
      createdAt: letter.created_at,
    })
  } catch (error) {
    console.error('Error updating pre-approval letter:', error)
    return errorResponse('Failed to update pre-approval letter')
  }
}

// DELETE - Delete pre-approval letter (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const letterId = parseInt(id, 10)

    if (isNaN(letterId)) {
      return errorResponse('Invalid letter ID', 400)
    }

    const existing = await prisma.preapproval_letters.findUnique({
      where: { id: letterId },
    })

    if (!existing) {
      return errorResponse('Pre-approval letter not found', 404)
    }

    await prisma.preapproval_letters.delete({
      where: { id: letterId },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting pre-approval letter:', error)
    return errorResponse('Failed to delete pre-approval letter')
  }
}
