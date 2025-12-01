import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get all mobile menu buttons (public for frontend, but includes all for admin when authenticated)
export async function GET() {
  try {
    const buttons = await prisma.mobile_menu_buttons.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    })

    return successResponse({
      buttons: buttons.map(btn => ({
        id: btn.id,
        label: btn.label,
        url: btn.url,
        icon: btn.icon,
        buttonType: btn.button_type,
        backgroundColor: btn.background_color,
        textColor: btn.text_color,
        borderColor: btn.border_color,
        order: btn.order,
        isActive: btn.is_active,
      })),
    })
  } catch (error) {
    console.error('Error fetching mobile menu buttons:', error)
    return errorResponse('Failed to fetch mobile menu buttons')
  }
}

// PUT - Update all mobile menu buttons (replaces all)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { buttons } = body

    if (!buttons || !Array.isArray(buttons)) {
      return errorResponse('buttons array is required', 400)
    }

    // Delete all existing buttons
    await prisma.mobile_menu_buttons.deleteMany({})

    // Create new buttons
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]
      await prisma.mobile_menu_buttons.create({
        data: {
          label: btn.label,
          url: btn.url,
          icon: btn.icon || null,
          button_type: btn.buttonType || 'outline',
          background_color: btn.backgroundColor || '#ffffff',
          text_color: btn.textColor || '#0f2e71',
          border_color: btn.borderColor || '#0f2e71',
          order: i,
          is_active: btn.isActive !== false,
        },
      })
    }

    // Fetch and return updated buttons
    const updatedButtons = await prisma.mobile_menu_buttons.findMany({
      orderBy: { order: 'asc' },
    })

    return successResponse({
      buttons: updatedButtons.map(btn => ({
        id: btn.id,
        label: btn.label,
        url: btn.url,
        icon: btn.icon,
        buttonType: btn.button_type,
        backgroundColor: btn.background_color,
        textColor: btn.text_color,
        borderColor: btn.border_color,
        order: btn.order,
        isActive: btn.is_active,
      })),
    })
  } catch (error) {
    console.error('Error updating mobile menu buttons:', error)
    return errorResponse('Failed to update mobile menu buttons')
  }
}
