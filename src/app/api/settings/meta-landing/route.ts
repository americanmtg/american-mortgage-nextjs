import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface MenuItem {
  label: string
  url: string
  openInNewTab?: boolean
}

// GET - Get meta landing page settings (public for frontend)
export async function GET() {
  try {
    const settings = await prisma.meta_landing_page_settings.findFirst()

    if (!settings) {
      // Return defaults if no settings exist
      return successResponse({
        noticeEnabled: true,
        headerDesktopEnabled: true,
        headerMobileEnabled: true,
        headerLogoCenteredMobile: false,
        menuEnabled: true,
        menuItems: [],
        applyButton: {
          desktopEnabled: true,
          mobileEnabled: true,
          iconEnabled: true,
          text: 'Apply Now',
          url: '/apply',
          color: '#d93c37',
          textColor: '#ffffff',
        },
        heading: {
          line1: 'Find Out',
          line2: 'Your Homebuying',
          line3: 'Budget Today',
        },
        description: 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
        ctaButton: {
          enabled: true,
          iconEnabled: true,
          text: 'Check My Budget',
          url: '/apply',
          color: '#d93c37',
          textColor: '#ffffff',
        },
      })
    }

    return successResponse({
      id: settings.id,
      noticeEnabled: settings.notice_enabled ?? true,
      headerDesktopEnabled: settings.header_desktop_enabled ?? true,
      headerMobileEnabled: settings.header_mobile_enabled ?? true,
      headerLogoCenteredMobile: settings.header_logo_centered_mobile ?? false,
      menuEnabled: settings.menu_enabled ?? true,
      menuItems: (settings.menu_items as unknown as MenuItem[]) || [],
      applyButton: {
        desktopEnabled: settings.apply_button_desktop_enabled ?? true,
        mobileEnabled: settings.apply_button_mobile_enabled ?? true,
        iconEnabled: settings.apply_button_icon_enabled ?? true,
        text: settings.apply_button_text || 'Apply Now',
        url: settings.apply_button_url || '/apply',
        color: settings.apply_button_color || '#d93c37',
        textColor: settings.apply_button_text_color || '#ffffff',
      },
      heading: {
        line1: settings.heading_line1 || 'Find Out',
        line2: settings.heading_line2 || 'Your Homebuying',
        line3: settings.heading_line3 || 'Budget Today',
      },
      description: settings.description_text || 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
      ctaButton: {
        enabled: settings.cta_button_enabled ?? true,
        iconEnabled: settings.cta_button_icon_enabled ?? true,
        text: settings.cta_button_text || 'Check My Budget',
        url: settings.cta_button_url || '/apply',
        color: settings.cta_button_color || '#d93c37',
        textColor: settings.cta_button_text_color || '#ffffff',
      },
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching meta landing settings:', error)
    return errorResponse('Failed to fetch meta landing settings')
  }
}

// PUT - Update meta landing page settings (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const { noticeEnabled, headerDesktopEnabled, headerMobileEnabled, headerLogoCenteredMobile, menuEnabled, menuItems, applyButton, heading, description, ctaButton } = body

    // Find existing settings or create new
    const existing = await prisma.meta_landing_page_settings.findFirst()

    const data = {
      ...(noticeEnabled !== undefined && { notice_enabled: noticeEnabled }),
      ...(headerDesktopEnabled !== undefined && { header_desktop_enabled: headerDesktopEnabled }),
      ...(headerMobileEnabled !== undefined && { header_mobile_enabled: headerMobileEnabled }),
      ...(headerLogoCenteredMobile !== undefined && { header_logo_centered_mobile: headerLogoCenteredMobile }),
      ...(menuEnabled !== undefined && { menu_enabled: menuEnabled }),
      ...(menuItems !== undefined && { menu_items: menuItems }),
      ...(applyButton?.desktopEnabled !== undefined && { apply_button_desktop_enabled: applyButton.desktopEnabled }),
      ...(applyButton?.mobileEnabled !== undefined && { apply_button_mobile_enabled: applyButton.mobileEnabled }),
      ...(applyButton?.iconEnabled !== undefined && { apply_button_icon_enabled: applyButton.iconEnabled }),
      ...(applyButton?.text !== undefined && { apply_button_text: applyButton.text }),
      ...(applyButton?.url !== undefined && { apply_button_url: applyButton.url }),
      ...(applyButton?.color !== undefined && { apply_button_color: applyButton.color }),
      ...(applyButton?.textColor !== undefined && { apply_button_text_color: applyButton.textColor }),
      ...(heading?.line1 !== undefined && { heading_line1: heading.line1 }),
      ...(heading?.line2 !== undefined && { heading_line2: heading.line2 }),
      ...(heading?.line3 !== undefined && { heading_line3: heading.line3 }),
      ...(description !== undefined && { description_text: description }),
      ...(ctaButton?.enabled !== undefined && { cta_button_enabled: ctaButton.enabled }),
      ...(ctaButton?.iconEnabled !== undefined && { cta_button_icon_enabled: ctaButton.iconEnabled }),
      ...(ctaButton?.text !== undefined && { cta_button_text: ctaButton.text }),
      ...(ctaButton?.url !== undefined && { cta_button_url: ctaButton.url }),
      ...(ctaButton?.color !== undefined && { cta_button_color: ctaButton.color }),
      ...(ctaButton?.textColor !== undefined && { cta_button_text_color: ctaButton.textColor }),
      updated_at: new Date(),
    }

    let settings
    if (existing) {
      settings = await prisma.meta_landing_page_settings.update({
        where: { id: existing.id },
        data,
      })
    } else {
      settings = await prisma.meta_landing_page_settings.create({
        data: {
          ...data,
          created_at: new Date(),
        },
      })
    }

    return successResponse({
      id: settings.id,
      noticeEnabled: settings.notice_enabled ?? true,
      headerDesktopEnabled: settings.header_desktop_enabled ?? true,
      headerMobileEnabled: settings.header_mobile_enabled ?? true,
      headerLogoCenteredMobile: settings.header_logo_centered_mobile ?? false,
      menuEnabled: settings.menu_enabled ?? true,
      menuItems: (settings.menu_items as unknown as MenuItem[]) || [],
      applyButton: {
        desktopEnabled: settings.apply_button_desktop_enabled ?? true,
        mobileEnabled: settings.apply_button_mobile_enabled ?? true,
        iconEnabled: settings.apply_button_icon_enabled ?? true,
        text: settings.apply_button_text || 'Apply Now',
        url: settings.apply_button_url || '/apply',
        color: settings.apply_button_color || '#d93c37',
        textColor: settings.apply_button_text_color || '#ffffff',
      },
      heading: {
        line1: settings.heading_line1 || 'Find Out',
        line2: settings.heading_line2 || 'Your Homebuying',
        line3: settings.heading_line3 || 'Budget Today',
      },
      description: settings.description_text || 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
      ctaButton: {
        enabled: settings.cta_button_enabled ?? true,
        iconEnabled: settings.cta_button_icon_enabled ?? true,
        text: settings.cta_button_text || 'Check My Budget',
        url: settings.cta_button_url || '/apply',
        color: settings.cta_button_color || '#d93c37',
        textColor: settings.cta_button_text_color || '#ffffff',
      },
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating meta landing settings:', error)
    return errorResponse('Failed to update meta landing settings')
  }
}
