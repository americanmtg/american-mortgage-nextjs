import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get SEO settings
export async function GET() {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const settings = await prisma.seo_settings.findFirst({
      include: {
        media_seo_settings_favicon_idTomedia: true,
        media_seo_settings_og_image_idTomedia: true,
      },
    })

    if (!settings) {
      return successResponse(null)
    }

    return successResponse({
      id: settings.id,
      siteTitle: settings.site_title,
      metaDescription: settings.meta_description,
      metaKeywords: settings.meta_keywords,
      faviconId: settings.favicon_id,
      favicon: settings.media_seo_settings_favicon_idTomedia ? {
        id: settings.media_seo_settings_favicon_idTomedia.id,
        alt: settings.media_seo_settings_favicon_idTomedia.alt,
        url: settings.media_seo_settings_favicon_idTomedia.url,
        filename: settings.media_seo_settings_favicon_idTomedia.filename,
      } : null,
      ogTitle: settings.og_title,
      ogDescription: settings.og_description,
      ogImageId: settings.og_image_id,
      ogImage: settings.media_seo_settings_og_image_idTomedia ? {
        id: settings.media_seo_settings_og_image_idTomedia.id,
        alt: settings.media_seo_settings_og_image_idTomedia.alt,
        url: settings.media_seo_settings_og_image_idTomedia.url,
        filename: settings.media_seo_settings_og_image_idTomedia.filename,
      } : null,
      googleAnalyticsId: settings.google_analytics_id,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return errorResponse('Failed to fetch SEO settings')
  }
}

// PUT - Update SEO settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      siteTitle,
      metaDescription,
      metaKeywords,
      faviconId,
      ogTitle,
      ogDescription,
      ogImageId,
      googleAnalyticsId,
    } = body

    const existing = await prisma.seo_settings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.seo_settings.update({
        where: { id: existing.id },
        data: {
          ...(siteTitle !== undefined && { site_title: siteTitle }),
          ...(metaDescription !== undefined && { meta_description: metaDescription }),
          ...(metaKeywords !== undefined && { meta_keywords: metaKeywords }),
          ...(faviconId !== undefined && { favicon_id: faviconId }),
          ...(ogTitle !== undefined && { og_title: ogTitle }),
          ...(ogDescription !== undefined && { og_description: ogDescription }),
          ...(ogImageId !== undefined && { og_image_id: ogImageId }),
          ...(googleAnalyticsId !== undefined && { google_analytics_id: googleAnalyticsId }),
          updated_at: new Date(),
        },
        include: {
          media_seo_settings_favicon_idTomedia: true,
          media_seo_settings_og_image_idTomedia: true,
        },
      })
    } else {
      settings = await prisma.seo_settings.create({
        data: {
          site_title: siteTitle || null,
          meta_description: metaDescription || null,
          meta_keywords: metaKeywords || null,
          favicon_id: faviconId || null,
          og_title: ogTitle || null,
          og_description: ogDescription || null,
          og_image_id: ogImageId || null,
          google_analytics_id: googleAnalyticsId || null,
        },
        include: {
          media_seo_settings_favicon_idTomedia: true,
          media_seo_settings_og_image_idTomedia: true,
        },
      })
    }

    return successResponse({
      id: settings.id,
      siteTitle: settings.site_title,
      metaDescription: settings.meta_description,
      metaKeywords: settings.meta_keywords,
      ogTitle: settings.og_title,
      ogDescription: settings.og_description,
      googleAnalyticsId: settings.google_analytics_id,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return errorResponse('Failed to update SEO settings')
  }
}
