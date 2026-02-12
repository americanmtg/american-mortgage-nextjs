import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { maskSsn } from '@/lib/encryption'

// GET - Paginated results with search and filters
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier') || ''
    const programId = searchParams.get('programId') || ''
    const batchId = searchParams.get('batchId') || ''
    const minScore = searchParams.get('minScore') || ''
    const maxScore = searchParams.get('maxScore') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { ssn_last_four: { contains: search } },
      ]
    }

    if (tier) where.tier = tier
    if (programId) where.program_id = parseInt(programId)
    if (batchId) where.batch_id = parseInt(batchId)

    // Score range filters
    if (minScore || maxScore) {
      where.middle_score = {}
      if (minScore) where.middle_score.gte = parseInt(minScore)
      if (maxScore) where.middle_score.lte = parseInt(maxScore)
    }

    const [leads, total] = await Promise.all([
      prisma.prescreen_leads.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          results: true,
          program: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } },
          _count: { select: { hard_pulls: true } },
        },
      }),
      prisma.prescreen_leads.count({ where }),
    ])

    const items = leads.map((lead) => {
      const bureauScores: Record<string, number | null> = {}
      for (const r of lead.results) {
        bureauScores[r.bureau] = r.credit_score
      }

      return {
        id: lead.id,
        firstName: lead.first_name,
        lastName: lead.last_name,
        ssnLastFour: lead.ssn_last_four,
        middleScore: lead.middle_score,
        tier: lead.tier,
        isQualified: lead.is_qualified,
        matchStatus: lead.match_status,
        bureauScores,
        programName: lead.program?.name,
        programId: lead.program?.id,
        batchId: lead.batch?.id,
        batchName: lead.batch?.name,
        firmOfferSent: lead.firm_offer_sent,
        firmOfferDate: lead.firm_offer_date,
        firmOfferMethod: lead.firm_offer_method,
        hardPullCount: lead._count.hard_pulls,
        createdAt: lead.created_at,
      }
    })

    // Audit log — one entry per page view
    await prisma.prescreen_audit_log.create({
      data: {
        action: 'view_results',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        details: { page, limit, filters: { search, tier, programId, batchId } },
      },
    }).catch(() => {}) // Don't fail the request on audit log errors

    return successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching prescreen results:', error)
    return errorResponse('Failed to fetch results')
  }
}
