import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - List all featured loans
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const loans = await prisma.featured_loans.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { order: 'asc' },
      include: {
        featured_loans_features: {
          orderBy: { order: 'asc' },
        },
        media: true,
      },
    })

    const items = loans.map(loan => ({
      id: loan.id,
      title: loan.title,
      subtitle: loan.subtitle,
      description: loan.description,
      icon: loan.icon,
      imageId: loan.image_id,
      image: loan.media ? {
        id: loan.media.id,
        url: loan.media.url,
        filename: loan.media.filename,
      } : null,
      linkUrl: loan.link_url,
      linkText: loan.link_text,
      order: loan.order ? Number(loan.order) : 0,
      isActive: loan.is_active,
      features: loan.featured_loans_features.map(f => ({
        id: f.id,
        text: f.text,
      })),
      updatedAt: loan.updated_at,
      createdAt: loan.created_at,
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching featured loans:', error)
    return errorResponse('Failed to fetch featured loans')
  }
}

// POST - Create new featured loan
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      icon,
      imageId,
      linkUrl,
      linkText,
      order,
      isActive,
      features,
    } = body

    if (!title) {
      return errorResponse('Title is required', 400)
    }

    // Validate icon enum
    const validIcons = ['home', 'building', 'refresh', 'shield', 'star', 'dollar', 'chart', 'key']
    if (icon && !validIcons.includes(icon)) {
      return errorResponse(`Invalid icon. Must be one of: ${validIcons.join(', ')}`, 400)
    }

    const loan = await prisma.featured_loans.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        icon: icon || 'home',
        image_id: imageId || null,
        link_url: linkUrl || null,
        link_text: linkText || 'Learn More',
        order: order ?? 0,
        is_active: isActive ?? true,
        featured_loans_features: features?.length ? {
          create: features.map((f: { text: string }, index: number) => ({
            id: uuidv4(),
            text: f.text,
            order: index,
          })),
        } : undefined,
      },
      include: {
        featured_loans_features: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return successResponse({
      id: loan.id,
      title: loan.title,
      subtitle: loan.subtitle,
      description: loan.description,
      icon: loan.icon,
      linkUrl: loan.link_url,
      linkText: loan.link_text,
      order: loan.order ? Number(loan.order) : 0,
      isActive: loan.is_active,
      features: loan.featured_loans_features.map(f => ({
        id: f.id,
        text: f.text,
      })),
      createdAt: loan.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating featured loan:', error)
    return errorResponse('Failed to create featured loan')
  }
}
