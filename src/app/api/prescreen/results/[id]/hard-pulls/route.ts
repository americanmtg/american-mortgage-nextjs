import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List hard pulls for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  const leadId = parseInt(params.id)
  if (isNaN(leadId)) return errorResponse('Invalid lead ID', 400)

  try {
    const hardPulls = await prisma.prescreen_hard_pulls.findMany({
      where: { lead_id: leadId },
      orderBy: { pull_date: 'desc' },
    })

    return successResponse({
      items: hardPulls.map((hp) => ({
        id: hp.id,
        leadId: hp.lead_id,
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
    })
  } catch (error) {
    console.error('Error fetching hard pulls:', error)
    return errorResponse('Failed to fetch hard pulls')
  }
}

// POST - Create a new hard pull record
export async function POST(
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
    // Verify lead exists
    const lead = await prisma.prescreen_leads.findUnique({
      where: { id: leadId },
    })
    if (!lead) return errorResponse('Lead not found', 404)

    const body = await request.json()
    const { pullDate, agency, lender, eqScore, tuScore, exScore, result, notes } = body

    if (!pullDate) return errorResponse('Pull date is required', 400)

    const hardPull = await prisma.prescreen_hard_pulls.create({
      data: {
        lead_id: leadId,
        pull_date: new Date(pullDate),
        agency: agency || null,
        lender: lender || null,
        eq_score: eqScore != null ? parseInt(eqScore) : null,
        tu_score: tuScore != null ? parseInt(tuScore) : null,
        ex_score: exScore != null ? parseInt(exScore) : null,
        result: result || 'pending',
        notes: notes || null,
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        lead_id: leadId,
        action: 'add_hard_pull',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        details: { hardPullId: hardPull.id, agency, lender, result },
      },
    })

    return successResponse({
      id: hardPull.id,
      leadId: hardPull.lead_id,
      pullDate: hardPull.pull_date,
      agency: hardPull.agency,
      lender: hardPull.lender,
      eqScore: hardPull.eq_score,
      tuScore: hardPull.tu_score,
      exScore: hardPull.ex_score,
      result: hardPull.result,
      notes: hardPull.notes,
    })
  } catch (error) {
    console.error('Error creating hard pull:', error)
    return errorResponse('Failed to create hard pull')
  }
}

// PUT - Update a hard pull record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const body = await request.json()
    const { hardPullId, pullDate, agency, lender, eqScore, tuScore, exScore, result, notes } = body

    if (!hardPullId) return errorResponse('hardPullId is required', 400)

    const existing = await prisma.prescreen_hard_pulls.findUnique({
      where: { id: hardPullId },
    })
    if (!existing) return errorResponse('Hard pull not found', 404)

    const updated = await prisma.prescreen_hard_pulls.update({
      where: { id: hardPullId },
      data: {
        pull_date: pullDate ? new Date(pullDate) : undefined,
        agency: agency !== undefined ? (agency || null) : undefined,
        lender: lender !== undefined ? (lender || null) : undefined,
        eq_score: eqScore !== undefined ? (eqScore != null ? parseInt(eqScore) : null) : undefined,
        tu_score: tuScore !== undefined ? (tuScore != null ? parseInt(tuScore) : null) : undefined,
        ex_score: exScore !== undefined ? (exScore != null ? parseInt(exScore) : null) : undefined,
        result: result || undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
        updated_at: new Date(),
      },
    })

    return successResponse({
      id: updated.id,
      pullDate: updated.pull_date,
      agency: updated.agency,
      lender: updated.lender,
      eqScore: updated.eq_score,
      tuScore: updated.tu_score,
      exScore: updated.ex_score,
      result: updated.result,
      notes: updated.notes,
    })
  } catch (error) {
    console.error('Error updating hard pull:', error)
    return errorResponse('Failed to update hard pull')
  }
}

// DELETE - Delete a hard pull record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const hardPullId = parseInt(searchParams.get('hardPullId') || '')
    if (isNaN(hardPullId)) return errorResponse('hardPullId is required', 400)

    await prisma.prescreen_hard_pulls.delete({
      where: { id: hardPullId },
    })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting hard pull:', error)
    return errorResponse('Failed to delete hard pull')
  }
}
