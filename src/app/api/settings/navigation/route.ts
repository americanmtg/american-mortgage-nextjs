import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get navigation settings
export async function GET() {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    // Get navigation record
    const navigation = await prisma.navigation.findFirst()

    if (!navigation) {
      return successResponse({ mainMenu: [] })
    }

    // Get main menu items
    const mainMenu = await prisma.navigation_main_menu.findMany({
      where: { parent_id: navigation.id },
      orderBy: { order: 'asc' },
    })

    // Get children for each menu item
    const menuWithChildren = await Promise.all(
      mainMenu.map(async (item) => {
        const children = await prisma.navigation_main_menu_children.findMany({
          where: { parent_id: item.id },
          orderBy: { order: 'asc' },
        })

        return {
          id: item.id,
          label: item.label,
          url: item.url,
          openInNewTab: item.open_in_new_tab || false,
          enabled: item.enabled ?? true,
          showOnDesktop: item.show_on_desktop ?? true,
          showOnMobileBar: item.show_on_mobile_bar ?? false,
          showInHamburger: item.show_in_hamburger ?? true,
          children: children.map(child => ({
            id: child.id,
            label: child.label,
            url: child.url,
            openInNewTab: child.open_in_new_tab || false,
            enabled: child.enabled ?? true,
          })),
        }
      })
    )

    return successResponse({
      id: navigation.id,
      mainMenu: menuWithChildren,
      updatedAt: navigation.updated_at,
    })
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return errorResponse('Failed to fetch navigation')
  }
}

// PUT - Update navigation settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { mainMenu } = body

    if (!mainMenu || !Array.isArray(mainMenu)) {
      return errorResponse('mainMenu array is required', 400)
    }

    // Find or create navigation record
    let navigation = await prisma.navigation.findFirst()

    if (!navigation) {
      navigation = await prisma.navigation.create({
        data: {},
      })
    }

    // Delete all existing menu items and children
    await prisma.navigation_main_menu_children.deleteMany({})
    await prisma.navigation_main_menu.deleteMany({
      where: { parent_id: navigation.id },
    })

    // Create new menu items with children
    for (let menuIndex = 0; menuIndex < mainMenu.length; menuIndex++) {
      const item = mainMenu[menuIndex]
      const menuId = uuidv4()

      await prisma.navigation_main_menu.create({
        data: {
          id: menuId,
          parent_id: navigation.id,
          label: item.label,
          url: item.url,
          open_in_new_tab: item.openInNewTab || false,
          enabled: item.enabled ?? true,
          show_on_desktop: item.showOnDesktop ?? true,
          show_on_mobile_bar: item.showOnMobileBar ?? false,
          show_in_hamburger: item.showInHamburger ?? true,
          order: menuIndex,
        },
      })

      // Create children if any
      if (item.children?.length) {
        for (let childIndex = 0; childIndex < item.children.length; childIndex++) {
          const child = item.children[childIndex]

          await prisma.navigation_main_menu_children.create({
            data: {
              id: uuidv4(),
              parent_id: menuId,
              label: child.label,
              url: child.url,
              open_in_new_tab: child.openInNewTab || false,
              enabled: child.enabled ?? true,
              order: childIndex,
            },
          })
        }
      }
    }

    // Update navigation timestamp
    await prisma.navigation.update({
      where: { id: navigation.id },
      data: { updated_at: new Date() },
    })

    // Fetch updated navigation
    const updatedMainMenu = await prisma.navigation_main_menu.findMany({
      where: { parent_id: navigation.id },
      orderBy: { order: 'asc' },
    })

    const menuWithChildren = await Promise.all(
      updatedMainMenu.map(async (item) => {
        const children = await prisma.navigation_main_menu_children.findMany({
          where: { parent_id: item.id },
          orderBy: { order: 'asc' },
        })

        return {
          id: item.id,
          label: item.label,
          url: item.url,
          openInNewTab: item.open_in_new_tab || false,
          enabled: item.enabled ?? true,
          showOnDesktop: item.show_on_desktop ?? true,
          showOnMobileBar: item.show_on_mobile_bar ?? false,
          showInHamburger: item.show_in_hamburger ?? true,
          children: children.map(child => ({
            id: child.id,
            label: child.label,
            url: child.url,
            openInNewTab: child.open_in_new_tab || false,
            enabled: child.enabled ?? true,
          })),
        }
      })
    )

    return successResponse({
      id: navigation.id,
      mainMenu: menuWithChildren,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error updating navigation:', error)
    return errorResponse('Failed to update navigation')
  }
}
