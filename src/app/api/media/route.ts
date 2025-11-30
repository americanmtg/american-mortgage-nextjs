import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET - List all media
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.media.count(),
    ])

    const items = media.map(m => ({
      id: m.id,
      alt: m.alt,
      url: m.url,
      filename: m.filename,
      mimeType: m.mime_type,
      filesize: m.filesize ? Number(m.filesize) : null,
      width: m.width ? Number(m.width) : null,
      height: m.height ? Number(m.height) : null,
      label: m.label,
      updatedAt: m.updated_at,
      createdAt: m.created_at,
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
    console.error('Error fetching media:', error)
    return errorResponse('Failed to fetch media')
  }
}

// Allowed MIME types for upload security
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  // Documents
  'application/pdf',
]

// POST - Upload new media
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string) || ''
    const label = formData.get('label') as string | null

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type for security
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        `File type not allowed. Allowed types: images (JPEG, PNG, GIF, WebP, SVG, ICO), videos (MP4, WebM, OGG), and PDF.`,
        400
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // Create database record
    const media = await prisma.media.create({
      data: {
        alt: alt || originalName,
        filename,
        url: `/uploads/${filename}`,
        mime_type: file.type,
        filesize: file.size,
        label: label || null,
      },
    })

    return successResponse({
      id: media.id,
      alt: media.alt,
      url: media.url,
      filename: media.filename,
      mimeType: media.mime_type,
      filesize: media.filesize ? Number(media.filesize) : null,
      label: media.label,
      createdAt: media.created_at,
    }, 201)
  } catch (error) {
    console.error('Error uploading media:', error)
    return errorResponse('Failed to upload media')
  }
}
