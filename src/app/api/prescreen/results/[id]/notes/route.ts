import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  const leadId = parseInt(params.id)
  if (isNaN(leadId)) return errorResponse('Invalid lead ID', 400)

  try {
    const notes = await prisma.prescreen_notes.findMany({
      where: { lead_id: leadId },
      orderBy: { created_at: 'desc' },
    })

    return successResponse({
      notes: notes.map((n) => ({
        id: n.id,
        content: n.content,
        createdByEmail: n.created_by_email,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })),
    })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return errorResponse('Failed to fetch notes')
  }
}

// POST - Add a new note
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
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return errorResponse('Note content is required', 400)
    }

    const note = await prisma.prescreen_notes.create({
      data: {
        lead_id: leadId,
        content: content.trim(),
        created_by: String(auth.session.userId),
        created_by_email: auth.session.email,
      },
    })

    return successResponse({
      note: {
        id: note.id,
        content: note.content,
        createdByEmail: note.created_by_email,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return errorResponse('Failed to create note')
  }
}

// PUT - Update an existing note
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
    const { noteId, content } = body

    if (!noteId || !content || !content.trim()) {
      return errorResponse('noteId and content are required', 400)
    }

    const note = await prisma.prescreen_notes.update({
      where: { id: noteId },
      data: { content: content.trim(), updated_at: new Date() },
    })

    return successResponse({
      note: {
        id: note.id,
        content: note.content,
        createdByEmail: note.created_by_email,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    })
  } catch (error) {
    console.error('Error updating note:', error)
    return errorResponse('Failed to update note')
  }
}

// DELETE - Remove a note
export async function DELETE(
  request: NextRequest,
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const noteId = parseInt(searchParams.get('noteId') || '')

    if (isNaN(noteId)) {
      return errorResponse('noteId is required', 400)
    }

    await prisma.prescreen_notes.delete({ where: { id: noteId } })

    return successResponse({ deleted: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return errorResponse('Failed to delete note')
  }
}
