import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// PUT - Update lead notes
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
    const { notes } = body

    const lead = await prisma.prescreen_leads.update({
      where: { id: leadId },
      data: { notes: notes || null, updated_at: new Date() },
    })

    return successResponse({ notes: lead.notes })
  } catch (error) {
    console.error('Error updating notes:', error)
    return errorResponse('Failed to update notes')
  }
}
