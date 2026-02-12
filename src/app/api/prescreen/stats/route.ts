import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Dashboard statistics
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    // Single aggregation query instead of 14 separate counts
    const [leadStats, batchAndProgramStats, recentBatches] = await Promise.all([
      prisma.$queryRaw<Array<Record<string, bigint>>>`
        SELECT
          COUNT(*) AS "totalLeads",
          COUNT(*) FILTER (WHERE is_qualified = true) AS "qualifiedCount",
          COUNT(*) FILTER (WHERE tier = 'tier_1') AS "tier1Count",
          COUNT(*) FILTER (WHERE tier = 'tier_2') AS "tier2Count",
          COUNT(*) FILTER (WHERE tier = 'tier_3') AS "tier3Count",
          COUNT(*) FILTER (WHERE tier = 'below') AS "belowCount",
          COUNT(*) FILTER (WHERE tier = 'filtered') AS "filteredCount",
          COUNT(*) FILTER (WHERE tier = 'pending') AS "pendingCount",
          COUNT(*) FILTER (WHERE middle_score >= 620) AS "score620Plus",
          COUNT(*) FILTER (WHERE middle_score >= 580 AND middle_score < 620) AS "score580to619",
          COUNT(*) FILTER (WHERE middle_score < 580 AND middle_score IS NOT NULL) AS "scoreUnder580"
        FROM prescreen_leads
      `,
      prisma.$queryRaw<Array<Record<string, bigint>>>`
        SELECT
          (SELECT COUNT(*) FROM prescreen_batches) AS "totalBatches",
          (SELECT COUNT(*) FROM prescreen_programs WHERE status = 'active') AS "totalPrograms"
      `,
      prisma.prescreen_batches.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          program: { select: { name: true } },
        },
      }),
    ])

    const s = leadStats[0]
    const bp = batchAndProgramStats[0]

    return successResponse({
      totalLeads: Number(s.totalLeads),
      qualifiedCount: Number(s.qualifiedCount),
      tier1Count: Number(s.tier1Count),
      tier2Count: Number(s.tier2Count),
      tier3Count: Number(s.tier3Count),
      belowCount: Number(s.belowCount),
      filteredCount: Number(s.filteredCount),
      pendingCount: Number(s.pendingCount),
      score620Plus: Number(s.score620Plus),
      score580to619: Number(s.score580to619),
      scoreUnder580: Number(s.scoreUnder580),
      totalBatches: Number(bp.totalBatches),
      totalPrograms: Number(bp.totalPrograms),
      recentBatches: recentBatches.map((b) => ({
        id: b.id,
        name: b.name,
        programName: b.program?.name,
        status: b.status,
        totalRecords: b.total_records,
        qualifiedCount: b.qualified_count,
        failedCount: b.failed_count,
        submittedByEmail: b.submitted_by_email,
        createdAt: b.created_at,
      })),
    })
  } catch (error) {
    console.error('Error fetching prescreen stats:', error)
    return errorResponse('Failed to fetch stats')
  }
}
