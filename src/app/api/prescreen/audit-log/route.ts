import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Paginated audit log
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const action = searchParams.get('action') || ''
    const leadId = searchParams.get('leadId') || ''
    const performedBy = searchParams.get('performedBy') || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (action) where.action = action
    if (leadId) where.lead_id = parseInt(leadId)
    if (performedBy) where.performed_by = parseInt(performedBy)

    const [logs, total] = await Promise.all([
      prisma.prescreen_audit_log.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          lead: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      }),
      prisma.prescreen_audit_log.count({ where }),
    ])

    const items = logs.map((log) => ({
      id: log.id,
      leadId: log.lead_id,
      leadName: log.lead ? `${log.lead.first_name} ${log.lead.last_name}` : null,
      batchId: log.batch_id,
      action: log.action,
      performedBy: log.performed_by,
      performedByEmail: log.performed_by_email,
      ipAddress: log.ip_address,
      details: log.details,
      createdAt: log.created_at,
    }))

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
    console.error('Error fetching prescreen audit log:', error)
    return errorResponse('Failed to fetch audit log')
  }
}
