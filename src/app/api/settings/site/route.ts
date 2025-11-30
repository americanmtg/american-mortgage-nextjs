import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get site settings (public - no auth required)
export async function GET() {
  try {
    const settings = await prisma.site_settings.findFirst({
      include: {
        media_site_settings_logo_idTomedia: true,
        media_site_settings_logo_white_idTomedia: true,
      },
    })

    if (!settings) {
      return successResponse(null)
    }

    return successResponse({
      id: settings.id,
      companyName: settings.company_name,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      legalBanner: settings.legal_banner,
      logoId: settings.logo_id,
      logo: settings.media_site_settings_logo_idTomedia ? {
        id: settings.media_site_settings_logo_idTomedia.id,
        alt: settings.media_site_settings_logo_idTomedia.alt,
        url: settings.media_site_settings_logo_idTomedia.url,
        filename: settings.media_site_settings_logo_idTomedia.filename,
      } : null,
      logoWhiteId: settings.logo_white_id,
      logoWhite: settings.media_site_settings_logo_white_idTomedia ? {
        id: settings.media_site_settings_logo_white_idTomedia.id,
        alt: settings.media_site_settings_logo_white_idTomedia.alt,
        url: settings.media_site_settings_logo_white_idTomedia.url,
        filename: settings.media_site_settings_logo_white_idTomedia.filename,
      } : null,
      logoHeight: settings.logo_height ? Number(settings.logo_height) : 40,
      logoWhiteHeight: settings.logo_white_height ? Number(settings.logo_white_height) : 40,
      socialLinks: {
        facebook: settings.social_links_facebook,
        twitter: settings.social_links_twitter,
        instagram: settings.social_links_instagram,
        linkedin: settings.social_links_linkedin,
        youtube: settings.social_links_youtube,
      },
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return errorResponse('Failed to fetch site settings')
  }
}

// PUT - Update site settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      companyName,
      phone,
      email,
      address,
      legalBanner,
      logoId,
      logoWhiteId,
      logoHeight,
      logoWhiteHeight,
      socialLinks,
    } = body

    // Find existing settings or create new
    const existing = await prisma.site_settings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.site_settings.update({
        where: { id: existing.id },
        data: {
          ...(companyName !== undefined && { company_name: companyName }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(address !== undefined && { address }),
          ...(legalBanner !== undefined && { legal_banner: legalBanner }),
          ...(logoId !== undefined && { logo_id: logoId }),
          ...(logoWhiteId !== undefined && { logo_white_id: logoWhiteId }),
          ...(logoHeight !== undefined && { logo_height: logoHeight }),
          ...(logoWhiteHeight !== undefined && { logo_white_height: logoWhiteHeight }),
          ...(socialLinks?.facebook !== undefined && { social_links_facebook: socialLinks.facebook }),
          ...(socialLinks?.twitter !== undefined && { social_links_twitter: socialLinks.twitter }),
          ...(socialLinks?.instagram !== undefined && { social_links_instagram: socialLinks.instagram }),
          ...(socialLinks?.linkedin !== undefined && { social_links_linkedin: socialLinks.linkedin }),
          ...(socialLinks?.youtube !== undefined && { social_links_youtube: socialLinks.youtube }),
          updated_at: new Date(),
        },
        include: {
          media_site_settings_logo_idTomedia: true,
          media_site_settings_logo_white_idTomedia: true,
        },
      })
    } else {
      settings = await prisma.site_settings.create({
        data: {
          company_name: companyName || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          legal_banner: legalBanner || null,
          logo_id: logoId || null,
          logo_white_id: logoWhiteId || null,
          logo_height: logoHeight || 40,
          logo_white_height: logoWhiteHeight || 40,
          social_links_facebook: socialLinks?.facebook || null,
          social_links_twitter: socialLinks?.twitter || null,
          social_links_instagram: socialLinks?.instagram || null,
          social_links_linkedin: socialLinks?.linkedin || null,
          social_links_youtube: socialLinks?.youtube || null,
        },
        include: {
          media_site_settings_logo_idTomedia: true,
          media_site_settings_logo_white_idTomedia: true,
        },
      })
    }

    return successResponse({
      id: settings.id,
      companyName: settings.company_name,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      legalBanner: settings.legal_banner,
      logoHeight: settings.logo_height ? Number(settings.logo_height) : 40,
      logoWhiteHeight: settings.logo_white_height ? Number(settings.logo_white_height) : 40,
      socialLinks: {
        facebook: settings.social_links_facebook,
        twitter: settings.social_links_twitter,
        instagram: settings.social_links_instagram,
        linkedin: settings.social_links_linkedin,
        youtube: settings.social_links_youtube,
      },
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error('Error updating site settings:', error)
    return errorResponse('Failed to update site settings')
  }
}
