import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { maskSsn, maskDob } from '@/lib/encryption'

// GET - Full lead detail with all bureau data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = params
    const leadId = parseInt(id)
    if (isNaN(leadId)) return errorResponse('Invalid lead ID', 400)

    const lead = await prisma.prescreen_leads.findUnique({
      where: { id: leadId },
      include: {
        results: true,
        hard_pulls: { orderBy: { pull_date: 'desc' } },
        program: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true, submitted_at: true } },
        audit_log: {
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    })

    if (!lead) return errorResponse('Lead not found', 404)

    // Bureau results
    const bureauResults = lead.results.map((r) => ({
      bureau: r.bureau,
      creditScore: r.credit_score,
      isHit: r.is_hit,
      rawOutput: r.raw_output,
      createdAt: r.created_at,
    }))

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        lead_id: leadId,
        action: 'view_detail',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    }).catch(() => {})

    return successResponse({
      id: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      middleInitial: lead.middle_initial,
      address: lead.address,
      address2: lead.address_2,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      ssnLastFour: lead.ssn_last_four,
      hasSsn: !!lead.ssn_encrypted,
      hasDob: !!lead.dob_encrypted,
      middleScore: lead.middle_score,
      tier: lead.tier,
      isQualified: lead.is_qualified,
      matchStatus: lead.match_status,
      segmentName: lead.segment_name,
      errorMessage: lead.error_message,
      notes: lead.notes,
      firmOfferSent: lead.firm_offer_sent,
      firmOfferDate: lead.firm_offer_date,
      firmOfferMethod: lead.firm_offer_method,
      bureauResults,
      hardPulls: lead.hard_pulls.map((hp) => ({
        id: hp.id,
        pullDate: hp.pull_date,
        agency: hp.agency,
        lender: hp.lender,
        eqScore: hp.eq_score,
        tuScore: hp.tu_score,
        exScore: hp.ex_score,
        result: hp.result,
        notes: hp.notes,
        performedByEmail: hp.performed_by_email,
        createdAt: hp.created_at,
      })),
      program: lead.program,
      batch: lead.batch ? {
        id: lead.batch.id,
        name: lead.batch.name,
        submittedAt: lead.batch.submitted_at,
      } : null,
      auditLog: lead.audit_log.map((a) => ({
        action: a.action,
        performedByEmail: a.performed_by_email,
        createdAt: a.created_at,
      })),
      createdAt: lead.created_at,
    })
  } catch (error) {
    console.error('Error fetching prescreen lead:', error)
    return errorResponse('Failed to fetch lead detail')
  }
}
