import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// PUT - Update firm offer status for a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  const leadId = parseInt(params.id)
  if (isNaN(leadId)) return errorResponse('Invalid lead ID', 400)

  try {
    const body = await request.json()
    const { sent, date, method } = body

    const lead = await prisma.prescreen_leads.update({
      where: { id: leadId },
      data: {
        firm_offer_sent: sent ?? false,
        firm_offer_date: date ? new Date(date) : null,
        firm_offer_method: method || null,
        updated_at: new Date(),
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        lead_id: leadId,
        action: sent ? 'firm_offer_sent' : 'firm_offer_cleared',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        details: { sent, date, method },
      },
    }).catch(() => {})

    return successResponse({
      firmOfferSent: lead.firm_offer_sent,
      firmOfferDate: lead.firm_offer_date,
      firmOfferMethod: lead.firm_offer_method,
    })
  } catch (error) {
    console.error('Error updating firm offer:', error)
    return errorResponse('Failed to update firm offer')
  }
}
