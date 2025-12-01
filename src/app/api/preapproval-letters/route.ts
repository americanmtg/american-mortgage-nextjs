import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all pre-approval letters (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const letters = await prisma.preapproval_letters.findMany({
      where: status ? { status: status as 'authentic' | 'invalid' | 'expired' } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        loan_officer: true,
      },
    })

    const items = letters.map(letter => ({
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
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching pre-approval letters:', error)
    return errorResponse('Failed to fetch pre-approval letters')
  }
}

// POST - Create new pre-approval letter (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { borrowerName, letterDate, referenceId, status, loanOfficerId, notes } = body

    if (!borrowerName) {
      return errorResponse('Borrower name is required', 400)
    }

    if (!letterDate) {
      return errorResponse('Letter date is required', 400)
    }

    if (!referenceId) {
      return errorResponse('Reference ID is required', 400)
    }

    // Check if reference ID already exists
    const existing = await prisma.preapproval_letters.findUnique({
      where: { reference_id: referenceId },
    })

    if (existing) {
      return errorResponse('A letter with this reference ID already exists', 400)
    }

    const validStatuses = ['authentic', 'invalid', 'expired']
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    const letter = await prisma.preapproval_letters.create({
      data: {
        borrower_name: borrowerName,
        letter_date: new Date(letterDate),
        reference_id: referenceId,
        status: status || 'authentic',
        loan_officer_id: loanOfficerId || null,
        notes: notes || null,
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
      createdAt: letter.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating pre-approval letter:', error)
    return errorResponse('Failed to create pre-approval letter')
  }
}
