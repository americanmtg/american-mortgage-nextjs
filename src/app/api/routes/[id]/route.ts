import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get single route
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const routeId = parseInt(id)
    if (isNaN(routeId)) {
      return errorResponse('Invalid route ID', 400)
    }

    const route = await prisma.routes.findUnique({
      where: { id: routeId },
    })

    if (!route) {
      return errorResponse('Route not found', 404)
    }

    return successResponse({
      id: route.id,
      name: route.name,
      path: route.path,
      description: route.description,
      icon: route.icon,
      isActive: route.is_active,
      updatedAt: route.updated_at,
      createdAt: route.created_at,
    })
  } catch (error) {
    console.error('Error fetching route:', error)
    return errorResponse('Failed to fetch route')
  }
}

// PATCH - Update route
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const routeId = parseInt(id)
    if (isNaN(routeId)) {
      return errorResponse('Invalid route ID', 400)
    }

    const body = await request.json()
    const {
      name,
      path,
      description,
      icon,
      isActive,
    } = body

    // Validate icon enum if provided
    if (icon) {
      const validIcons = ['calculator', 'document', 'home', 'user', 'chart', 'money', 'info', 'question']
      if (!validIcons.includes(icon)) {
        return errorResponse(`Invalid icon. Must be one of: ${validIcons.join(', ')}`, 400)
      }
    }

    // Check if new path conflicts with existing route
    if (path) {
      const existing = await prisma.routes.findFirst({
        where: {
          path,
          NOT: { id: routeId },
        },
      })
      if (existing) {
        return errorResponse('A route with this path already exists', 400)
      }
    }

    const route = await prisma.routes.update({
      where: { id: routeId },
      data: {
        ...(name !== undefined && { name }),
        ...(path !== undefined && { path }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { is_active: isActive }),
        updated_at: new Date(),
      },
    })

    return successResponse({
      id: route.id,
      name: route.name,
      path: route.path,
      description: route.description,
      icon: route.icon,
      isActive: route.is_active,
      updatedAt: route.updated_at,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Route not found', 404)
    }
    console.error('Error updating route:', error)
    return errorResponse('Failed to update route')
  }
}

// DELETE - Delete route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const routeId = parseInt(id)
    if (isNaN(routeId)) {
      return errorResponse('Invalid route ID', 400)
    }

    await prisma.routes.delete({
      where: { id: routeId },
    })

    return successResponse({ success: true, deletedId: routeId })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Route not found', 404)
    }
    console.error('Error deleting route:', error)
    return errorResponse('Failed to delete route')
  }
}
