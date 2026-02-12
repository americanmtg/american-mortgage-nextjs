import { NextRequest } from 'next/server'
import { requireAdmin, requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// PATCH - Rename a batch
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { id, name } = body as { id: number; name: string }

    if (!id || !name?.trim()) {
      return errorResponse('id and name are required', 400)
    }

    const batch = await prisma.prescreen_batches.findUnique({ where: { id } })
    if (!batch) return errorResponse('Batch not found', 404)

    const updated = await prisma.prescreen_batches.update({
      where: { id },
      data: { name: name.trim(), updated_at: new Date() },
    })

    return successResponse({ id: updated.id, name: updated.name })
  } catch (error) {
    console.error('Error renaming batch:', error)
    return errorResponse('Failed to rename batch')
  }
}

// GET - Paginated batch history
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)
    const status = searchParams.get('status') || ''
    const programId = searchParams.get('programId') || ''
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (programId) where.program_id = parseInt(programId)

    const [batches, total] = await Promise.all([
      prisma.prescreen_batches.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          program: { select: { id: true, name: true } },
        },
      }),
      prisma.prescreen_batches.count({ where }),
    ])

    const items = batches.map((b) => ({
      id: b.id,
      name: b.name,
      programId: b.program_id,
      programName: b.program?.name,
      status: b.status,
      totalRecords: b.total_records,
      qualifiedCount: b.qualified_count,
      failedCount: b.failed_count,
      submittedBy: b.submitted_by,
      submittedByEmail: b.submitted_by_email,
      submittedAt: b.submitted_at,
      completedAt: b.completed_at,
      errorMessage: b.error_message,
      createdAt: b.created_at,
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
    console.error('Error fetching prescreen batches:', error)
    return errorResponse('Failed to fetch batches')
  }
}
