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
    const matchStatus = searchParams.get('matchStatus') || ''
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

    if (tier === 'unqualified') {
      // Unqualified = below threshold (tier=below) OR filtered+matched (no scores returned)
      where.OR = [
        { tier: 'below' },
        { tier: 'filtered', match_status: 'matched' },
      ]
    } else {
      if (tier) where.tier = tier
      if (matchStatus) where.match_status = matchStatus
    }
    if (programId) where.program_id = parseInt(programId)
    if (batchId) {
      // Check if this batch has lead_ids (fill batches store leads separately)
      const batch = await prisma.prescreen_batches.findUnique({
        where: { id: parseInt(batchId) },
        select: { lead_ids: true },
      })
      if (batch?.lead_ids && Array.isArray(batch.lead_ids) && (batch.lead_ids as number[]).length > 0) {
        where.id = { in: batch.lead_ids as number[] }
      } else {
        where.batch_id = parseInt(batchId)
      }
    }

    // Score range filters
    if (minScore || maxScore) {
      where.middle_score = {}
      if (minScore) where.middle_score.gte = parseInt(minScore)
      if (maxScore) where.middle_score.lte = parseInt(maxScore)
    }

    // Custom sort for tier: logical order instead of alphabetical
    // tier_1 (1) > tier_2 (2) > tier_3 (3) > below (4) > unqualified/filtered+matched (5) > no_match (6) > pending (7)
    // Sorts that need JS-based ordering (computed fields can't be sorted in Prisma)
    const jsSort = sortBy === 'tier' || sortBy === 'created_at' || sortBy === 'middle_score'
    let orderBy: any
    if (sortBy === 'tier') {
      orderBy = [{ tier: sortDir }, { match_status: sortDir === 'asc' ? 'desc' : 'asc' }]
    } else if (sortBy === 'created_at') {
      // Date column displays lastActivity (latest result date or creation date)
      // Fetch all and sort in JS so the sort matches the displayed value
      orderBy = { created_at: sortDir }
    } else {
      orderBy = { [sortBy]: sortDir }
    }

    const [leads, total] = await Promise.all([
      prisma.prescreen_leads.findMany({
        where,
        skip: jsSort ? 0 : skip,
        take: jsSort ? undefined : limit,
        orderBy,
        include: {
          results: true,
          program: { select: { id: true, name: true, eq_enabled: true, tu_enabled: true, ex_enabled: true } },
          batch: { select: { id: true, name: true } },
          _count: { select: { hard_pulls: true } },
        },
      }),
      prisma.prescreen_leads.count({ where }),
    ])

    // For JS-sorted fields: apply custom ordering then paginate
    if (sortBy === 'tier') {
      const tierRank = (t: string | null, ms: string | null) => {
        if (t === 'tier_1') return 1
        if (t === 'tier_2') return 2
        if (t === 'tier_3') return 3
        if (t === 'below') return 4
        if (t === 'filtered' && ms !== 'no_match') return 5 // unqualified
        if (t === 'filtered' && ms === 'no_match') return 6 // no match
        return 7 // pending
      }
      leads.sort((a, b) => {
        const rankA = tierRank(a.tier, a.match_status)
        const rankB = tierRank(b.tier, b.match_status)
        return sortDir === 'asc' ? rankA - rankB : rankB - rankA
      })
      leads.splice(0, skip)
      leads.splice(limit)
    }

    // For middle_score sort: nulls always last
    if (sortBy === 'middle_score') {
      leads.sort((a, b) => {
        const aNull = a.middle_score == null
        const bNull = b.middle_score == null
        if (aNull && bNull) return 0
        if (aNull) return 1
        if (bNull) return -1
        return sortDir === 'asc' ? a.middle_score! - b.middle_score! : b.middle_score! - a.middle_score!
      })
      leads.splice(0, skip)
      leads.splice(limit)
    }

    // For date sort: sort by lastActivity (latest result date or creation date)
    if (sortBy === 'created_at') {
      const getLastActivity = (lead: typeof leads[0]) => {
        const resultDates = lead.results.map(r => r.created_at ? new Date(r.created_at).getTime() : 0)
        const latestResult = resultDates.length > 0 ? Math.max(...resultDates) : 0
        const createdAt = lead.created_at ? new Date(lead.created_at).getTime() : 0
        return Math.max(latestResult, createdAt)
      }
      leads.sort((a, b) => {
        const actA = getLastActivity(a)
        const actB = getLastActivity(b)
        return sortDir === 'asc' ? actA - actB : actB - actA
      })
      leads.splice(0, skip)
      leads.splice(limit)
    }

    const items = leads.map((lead) => {
      const bureauScores: Record<string, number | null> = {}
      const bureauHits: Record<string, boolean> = {}
      for (const r of lead.results) {
        bureauScores[r.bureau] = r.credit_score
        bureauHits[r.bureau] = !!r.is_hit
      }

      // Most recent activity: latest bureau result date or lead creation
      const latestResultDate = lead.results.length > 0
        ? lead.results.reduce((latest, r) => {
            const d = r.created_at ? new Date(r.created_at).getTime() : 0
            return d > latest ? d : latest
          }, 0)
        : 0
      const lastActivity = latestResultDate > new Date(lead.created_at!).getTime()
        ? new Date(latestResultDate)
        : lead.created_at

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
        bureauHits,
        programName: lead.program?.name,
        programId: lead.program?.id,
        programBureaus: {
          eq: !!lead.program?.eq_enabled,
          tu: !!lead.program?.tu_enabled,
          ex: !!lead.program?.ex_enabled,
        },
        batchId: lead.batch?.id,
        batchName: lead.batch?.name,
        firmOfferSent: lead.firm_offer_sent,
        firmOfferDate: lead.firm_offer_date,
        firmOfferMethod: lead.firm_offer_method,
        hardPullCount: lead._count.hard_pulls,
        createdAt: lead.created_at,
        lastActivity,
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
