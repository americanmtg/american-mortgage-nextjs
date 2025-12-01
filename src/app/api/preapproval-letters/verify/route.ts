import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Public endpoint to verify a pre-approval letter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referenceId } = body

    if (!referenceId || typeof referenceId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Reference ID is required',
      }, { status: 400 })
    }

    // Trim and normalize the reference ID
    const normalizedId = referenceId.trim()

    // Case-insensitive search for the reference ID
    const letter = await prisma.preapproval_letters.findFirst({
      where: {
        reference_id: {
          equals: normalizedId,
          mode: 'insensitive',
        },
      },
      include: {
        loan_officer: true,
      },
    })

    if (!letter) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'not_found',
      })
    }

    // Only return verification success if status is 'authentic'
    if (letter.status === 'authentic') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'authentic',
        data: {
          borrowerName: letter.borrower_name,
          letterDate: letter.letter_date,
          loanOfficer: letter.loan_officer ? {
            name: letter.loan_officer.name,
            phone: letter.loan_officer.phone,
            email: letter.loan_officer.email,
          } : null,
        },
      })
    }

    // Return the specific status (invalid or expired) with loan officer for contact
    return NextResponse.json({
      success: true,
      verified: false,
      message: letter.status,
      data: {
        loanOfficer: letter.loan_officer ? {
          name: letter.loan_officer.name,
          phone: letter.loan_officer.phone,
          email: letter.loan_officer.email,
        } : null,
      },
    })
  } catch (error) {
    console.error('Error verifying pre-approval letter:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred while verifying the letter',
    }, { status: 500 })
  }
}
