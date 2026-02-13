import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Fetch all leads queued for retry
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const leads = await prisma.prescreen_leads.findMany({
      where: { retry_queued: true },
      orderBy: { updated_at: 'desc' },
      include: {
        batch: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
    })

    return successResponse({
      leads: leads.map((l) => ({
        id: l.id,
        firstName: l.first_name,
        lastName: l.last_name,
        middleInitial: l.middle_initial,
        address: l.address,
        address2: l.address_2,
        city: l.city,
        state: l.state,
        zip: l.zip,
        ssnLastFour: l.ssn_last_four,
        hasSsn: !!l.ssn_encrypted,
        hasDob: !!l.dob_encrypted,
        tier: l.tier,
        matchStatus: l.match_status,
        errorMessage: l.error_message,
        batchId: l.batch_id,
        batchName: l.batch?.name,
        programId: l.program_id,
        programName: l.program?.name,
        createdAt: l.created_at,
      })),
      count: leads.length,
    })
  } catch (error) {
    console.error('Error fetching retry queue:', error)
    return errorResponse('Failed to fetch retry queue')
  }
}

// PATCH - Add or remove leads from retry queue
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { leadIds, queued } = body as { leadIds: number[]; queued: boolean }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return errorResponse('leadIds array is required', 400)
    }

    await prisma.prescreen_leads.updateMany({
      where: { id: { in: leadIds } },
      data: { retry_queued: queued, updated_at: new Date() },
    })

    return successResponse({ updated: leadIds.length, queued })
  } catch (error) {
    console.error('Error updating retry queue:', error)
    return errorResponse('Failed to update retry queue')
  }
}
