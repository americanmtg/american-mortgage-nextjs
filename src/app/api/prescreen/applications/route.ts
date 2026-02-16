import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List incoming applications
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    const applications = await prisma.prescreen_applications.findMany({
      where: { status },
      orderBy: { created_at: 'desc' },
      include: {
        prescreen_lead: {
          select: { id: true, tier: true, middle_score: true },
        },
      },
    })

    const items = applications.map(app => ({
      id: app.id,
      source: app.source,
      sourceLoanId: app.source_loan_id,
      borrowerType: app.borrower_type,
      firstName: app.first_name,
      lastName: app.last_name,
      email: app.email,
      phone: app.phone,
      address: app.address,
      address2: app.address_2,
      city: app.city,
      state: app.state,
      zip: app.zip,
      dob: app.dob,
      hasSsn: !!app.ssn_encrypted,
      ssnLastFour: app.ssn_last_four,
      hasDob: !!app.dob_encrypted,
      loanAmount: app.loan_amount ? Number(app.loan_amount) : null,
      loanPurpose: app.loan_purpose,
      loanType: app.loan_type,
      propertyAddress: app.property_address,
      propertyCity: app.property_city,
      propertyState: app.property_state,
      propertyZip: app.property_zip,
      status: app.status,
      prescreenLeadId: app.prescreen_lead_id,
      prescreenLead: app.prescreen_lead,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    }))

    return successResponse({ items, total: items.length })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return errorResponse('Failed to fetch applications')
  }
}
