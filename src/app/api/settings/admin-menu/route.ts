import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get admin menu order
export async function GET() {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const settings = await prisma.admin_menu_settings.findFirst()

    return successResponse({
      menuOrder: settings?.menu_order || [],
    })
  } catch (error) {
    console.error('Error fetching admin menu settings:', error)
    return errorResponse('Failed to fetch admin menu settings')
  }
}

// PUT - Update admin menu order
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  // Only admins can reorder the menu
  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can reorder the menu', 403)
  }

  try {
    const body = await request.json()
    const { menuOrder } = body

    if (!Array.isArray(menuOrder)) {
      return errorResponse('menuOrder must be an array')
    }

    const existing = await prisma.admin_menu_settings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.admin_menu_settings.update({
        where: { id: existing.id },
        data: {
          menu_order: menuOrder,
          updated_at: new Date(),
        },
      })
    } else {
      settings = await prisma.admin_menu_settings.create({
        data: {
          menu_order: menuOrder,
        },
      })
    }

    return successResponse({
      menuOrder: settings.menu_order,
    })
  } catch (error) {
    console.error('Error updating admin menu settings:', error)
    return errorResponse('Failed to update admin menu settings')
  }
}
