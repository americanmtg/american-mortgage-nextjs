import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - List all routes
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const routes = await prisma.routes.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { path: 'asc' },
    })

    const items = routes.map(route => ({
      id: route.id,
      name: route.name,
      path: route.path,
      description: route.description,
      icon: route.icon,
      isActive: route.is_active,
      updatedAt: route.updated_at,
      createdAt: route.created_at,
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return errorResponse('Failed to fetch routes')
  }
}

// POST - Create new route
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      name,
      path,
      description,
      icon,
      isActive,
    } = body

    if (!name || !path) {
      return errorResponse('Name and path are required', 400)
    }

    // Validate icon enum
    const validIcons = ['calculator', 'document', 'home', 'user', 'chart', 'money', 'info', 'question']
    if (icon && !validIcons.includes(icon)) {
      return errorResponse(`Invalid icon. Must be one of: ${validIcons.join(', ')}`, 400)
    }

    // Check if path already exists
    const existing = await prisma.routes.findUnique({
      where: { path },
    })
    if (existing) {
      return errorResponse('A route with this path already exists', 400)
    }

    const route = await prisma.routes.create({
      data: {
        name,
        path,
        description: description || null,
        icon: icon || 'document',
        is_active: isActive ?? true,
      },
    })

    return successResponse({
      id: route.id,
      name: route.name,
      path: route.path,
      description: route.description,
      icon: route.icon,
      isActive: route.is_active,
      createdAt: route.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating route:', error)
    return errorResponse('Failed to create route')
  }
}
