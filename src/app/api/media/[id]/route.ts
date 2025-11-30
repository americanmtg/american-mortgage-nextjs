import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const mediaId = parseInt(id)
    if (isNaN(mediaId)) {
      return errorResponse('Invalid media ID', 400)
    }

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    })

    if (!media) {
      return errorResponse('Media not found', 404)
    }

    return successResponse({
      id: media.id,
      alt: media.alt,
      url: media.url,
      filename: media.filename,
      mimeType: media.mime_type,
      filesize: media.filesize ? Number(media.filesize) : null,
      width: media.width ? Number(media.width) : null,
      height: media.height ? Number(media.height) : null,
      focalX: media.focal_x ? Number(media.focal_x) : null,
      focalY: media.focal_y ? Number(media.focal_y) : null,
      label: media.label,
      updatedAt: media.updated_at,
      createdAt: media.created_at,
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return errorResponse('Failed to fetch media')
  }
}

// PATCH - Update media metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const mediaId = parseInt(id)
    if (isNaN(mediaId)) {
      return errorResponse('Invalid media ID', 400)
    }

    const body = await request.json()
    const { alt, label, focalX, focalY } = body

    const media = await prisma.media.update({
      where: { id: mediaId },
      data: {
        ...(alt !== undefined && { alt }),
        ...(label !== undefined && { label }),
        ...(focalX !== undefined && { focal_x: focalX }),
        ...(focalY !== undefined && { focal_y: focalY }),
        updated_at: new Date(),
      },
    })

    return successResponse({
      id: media.id,
      alt: media.alt,
      url: media.url,
      filename: media.filename,
      mimeType: media.mime_type,
      label: media.label,
      focalX: media.focal_x ? Number(media.focal_x) : null,
      focalY: media.focal_y ? Number(media.focal_y) : null,
      updatedAt: media.updated_at,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Media not found', 404)
    }
    console.error('Error updating media:', error)
    return errorResponse('Failed to update media')
  }
}

// DELETE - Delete media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const mediaId = parseInt(id)
    if (isNaN(mediaId)) {
      return errorResponse('Invalid media ID', 400)
    }

    // Get media to find file path
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    })

    if (!media) {
      return errorResponse('Media not found', 404)
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    })

    // Try to delete file from disk
    if (media.filename) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', media.filename)
      if (existsSync(filePath)) {
        try {
          await unlink(filePath)
        } catch (e) {
          console.warn('Could not delete file:', filePath)
        }
      }
    }

    return successResponse({ success: true, deletedId: mediaId })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Media not found', 404)
    }
    console.error('Error deleting media:', error)
    return errorResponse('Failed to delete media')
  }
}
