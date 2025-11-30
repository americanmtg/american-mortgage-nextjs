import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get header settings
export async function GET() {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const settings = await prisma.header_settings.findFirst({
      include: {
        media_pattern_image: true,
        media_background_image: true,
      },
    })

    if (!settings) {
      return successResponse(null)
    }

    return successResponse({
      id: settings.id,
      backgroundType: settings.background_type,
      backgroundColor: settings.background_color,
      gradientStartColor: settings.gradient_start_color,
      gradientEndColor: settings.gradient_end_color,
      gradientDirection: settings.gradient_direction,
      patternType: settings.pattern_type,
      patternColor: settings.pattern_color,
      patternBackgroundColor: settings.pattern_background_color,
      patternImageId: settings.pattern_image_id,
      patternImage: settings.media_pattern_image ? {
        id: settings.media_pattern_image.id,
        url: settings.media_pattern_image.url,
        filename: settings.media_pattern_image.filename,
      } : null,
      backgroundImageId: settings.background_image_id,
      backgroundImage: settings.media_background_image ? {
        id: settings.media_background_image.id,
        url: settings.media_background_image.url,
        filename: settings.media_background_image.filename,
      } : null,
      backgroundImageOverlay: settings.background_image_overlay,
      backgroundVideoId: settings.background_video_id,
      backgroundVideoUrl: settings.background_video_url,
      backgroundVideoOverlay: settings.background_video_overlay,
      headerButtonText: settings.header_button_text,
      headerButtonUrl: settings.header_button_url,
      headerButtonBackgroundColor: settings.header_button_background_color,
      headerButtonTextColor: settings.header_button_text_color,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching header settings:', error)
    return errorResponse('Failed to fetch header settings')
  }
}

// PUT - Update header settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      backgroundType,
      backgroundColor,
      gradientStartColor,
      gradientEndColor,
      gradientDirection,
      patternType,
      patternColor,
      patternBackgroundColor,
      patternImageId,
      backgroundImageId,
      backgroundImageOverlay,
      backgroundVideoId,
      backgroundVideoUrl,
      backgroundVideoOverlay,
      headerButtonText,
      headerButtonUrl,
      headerButtonBackgroundColor,
      headerButtonTextColor,
    } = body

    const existing = await prisma.header_settings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.header_settings.update({
        where: { id: existing.id },
        data: {
          ...(backgroundType !== undefined && { background_type: backgroundType }),
          ...(backgroundColor !== undefined && { background_color: backgroundColor }),
          ...(gradientStartColor !== undefined && { gradient_start_color: gradientStartColor }),
          ...(gradientEndColor !== undefined && { gradient_end_color: gradientEndColor }),
          ...(gradientDirection !== undefined && { gradient_direction: gradientDirection }),
          ...(patternType !== undefined && { pattern_type: patternType }),
          ...(patternColor !== undefined && { pattern_color: patternColor }),
          ...(patternBackgroundColor !== undefined && { pattern_background_color: patternBackgroundColor }),
          ...(patternImageId !== undefined && { pattern_image_id: patternImageId }),
          ...(backgroundImageId !== undefined && { background_image_id: backgroundImageId }),
          ...(backgroundImageOverlay !== undefined && { background_image_overlay: backgroundImageOverlay }),
          ...(backgroundVideoId !== undefined && { background_video_id: backgroundVideoId }),
          ...(backgroundVideoUrl !== undefined && { background_video_url: backgroundVideoUrl }),
          ...(backgroundVideoOverlay !== undefined && { background_video_overlay: backgroundVideoOverlay }),
          ...(headerButtonText !== undefined && { header_button_text: headerButtonText }),
          ...(headerButtonUrl !== undefined && { header_button_url: headerButtonUrl }),
          ...(headerButtonBackgroundColor !== undefined && { header_button_background_color: headerButtonBackgroundColor }),
          ...(headerButtonTextColor !== undefined && { header_button_text_color: headerButtonTextColor }),
          updated_at: new Date(),
        },
      })
    } else {
      settings = await prisma.header_settings.create({
        data: {
          background_type: backgroundType || 'solid',
          background_color: backgroundColor || '#ffffff',
          gradient_start_color: gradientStartColor || '#ffffff',
          gradient_end_color: gradientEndColor || '#f0f0f0',
          gradient_direction: gradientDirection || 'to-right',
          pattern_type: patternType || 'dots',
          pattern_color: patternColor || '#e5e5e5',
          pattern_background_color: patternBackgroundColor || '#ffffff',
          pattern_image_id: patternImageId || null,
          background_image_id: backgroundImageId || null,
          background_image_overlay: backgroundImageOverlay || 'rgba(255,255,255,0.9)',
          background_video_id: backgroundVideoId || null,
          background_video_url: backgroundVideoUrl || null,
          background_video_overlay: backgroundVideoOverlay || 'rgba(255,255,255,0.9)',
          header_button_text: headerButtonText || 'Apply',
          header_button_url: headerButtonUrl || '/apply',
          header_button_background_color: headerButtonBackgroundColor || '#d93c37',
          header_button_text_color: headerButtonTextColor || '#ffffff',
        },
      })
    }

    return successResponse({
      id: settings.id,
      backgroundType: settings.background_type,
      backgroundColor: settings.background_color,
      headerButtonText: settings.header_button_text,
      headerButtonUrl: settings.header_button_url,
      headerButtonBackgroundColor: settings.header_button_background_color,
      headerButtonTextColor: settings.header_button_text_color,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating header settings:', error)
    return errorResponse('Failed to update header settings')
  }
}
