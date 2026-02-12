import { NextRequest } from 'next/server'
import { requireAdmin, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { getBillingReport } from '@/lib/services/altair'

// GET - Combined billing and usage stats
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Local usage stats — always available
    const [bureauCounts, batchStats, monthlyUsage, recentBatches] = await Promise.all([
      prisma.$queryRaw<Array<{ bureau: string; count: bigint }>>`
        SELECT bureau, COUNT(*) as count FROM prescreen_results GROUP BY bureau
      `,
      prisma.$queryRaw<Array<Record<string, bigint>>>`
        SELECT
          COUNT(*) AS "totalBatches",
          COALESCE(SUM(total_records), 0) AS "totalRecords",
          COALESCE(SUM(qualified_count), 0) AS "qualifiedRecords",
          COALESCE(SUM(failed_count), 0) AS "failedRecords"
        FROM prescreen_batches
      `,
      prisma.$queryRaw<Array<{ month: string; leads: bigint; pulls: bigint }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', l.created_at), 'YYYY-MM') AS month,
          COUNT(DISTINCT l.id) AS leads,
          COUNT(r.id) AS pulls
        FROM prescreen_leads l
        LEFT JOIN prescreen_results r ON r.lead_id = l.id
        GROUP BY DATE_TRUNC('month', l.created_at)
        ORDER BY month DESC
        LIMIT 12
      `,
      prisma.prescreen_batches.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { program: { select: { name: true } } },
      }),
    ])

    const bureauPulls: Record<string, number> = {}
    let totalPulls = 0
    for (const row of bureauCounts) {
      bureauPulls[row.bureau] = Number(row.count)
      totalPulls += Number(row.count)
    }

    const bs = batchStats[0]

    // Altair billing report — may fail (401 on sandbox)
    let altairBilling = null
    let altairError = null
    if (startDate && endDate) {
      const result = await getBillingReport(startDate, endDate)
      if (result.success) {
        altairBilling = result.records
      } else {
        altairError = result.error
      }
    }

    // Compute altair billing totals if available
    let altairTotals = null
    if (altairBilling && altairBilling.length > 0) {
      altairTotals = { cost: 0, matches: 0, baseCost: 0, addOns: 0 }
      for (const r of altairBilling) {
        altairTotals.cost += r.total || 0
        altairTotals.matches += r.matches || 0
        altairTotals.baseCost += r.base_cost || 0
        altairTotals.addOns += (r.income_est || 0) + (r.cltv || 0) + (r.est_value || 0) + (r.owner_status || 0)
      }
    }

    return successResponse({
      usage: {
        totalPulls,
        bureauPulls,
        totalBatches: Number(bs.totalBatches),
        totalRecords: Number(bs.totalRecords),
        qualifiedRecords: Number(bs.qualifiedRecords),
        failedRecords: Number(bs.failedRecords),
        sandboxLimit: 50,
        sandboxRemaining: Math.max(0, 50 - totalPulls),
      },
      monthlyUsage: monthlyUsage.map(m => ({
        month: m.month,
        leads: Number(m.leads),
        pulls: Number(m.pulls),
      })),
      recentBatches: recentBatches.map(b => ({
        id: b.id,
        name: b.name,
        programName: b.program?.name,
        status: b.status,
        totalRecords: b.total_records,
        qualifiedCount: b.qualified_count,
        failedCount: b.failed_count,
        submittedBy: b.submitted_by_email,
        createdAt: b.created_at,
      })),
      altairBilling,
      altairTotals,
      altairError,
    })
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return errorResponse('Failed to fetch billing data')
  }
}
