import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get verify page settings (public for page rendering, but only returns non-sensitive fields)
export async function GET() {
  try {
    let settings = await prisma.verify_page_settings.findUnique({
      where: { id: 1 },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.verify_page_settings.create({
        data: { id: 1 },
      })
    }

    return successResponse({
      pageTitle: settings.page_title,
      pageSubtitle: settings.page_subtitle,
      successTitle: settings.success_title,
      successMessage: settings.success_message,
      failTitle: settings.fail_title,
      failMessage: settings.fail_message,
      defaultContactName: settings.default_contact_name,
      defaultContactNmlsId: settings.default_contact_nmls_id,
      defaultContactPhone: settings.default_contact_phone,
      defaultContactEmail: settings.default_contact_email,
      defaultContactPhoto: settings.default_contact_photo,
    })
  } catch (error) {
    console.error('Error fetching verify page settings:', error)
    return errorResponse('Failed to fetch verify page settings')
  }
}

// PUT - Update verify page settings (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      pageTitle,
      pageSubtitle,
      successTitle,
      successMessage,
      failTitle,
      failMessage,
      defaultContactName,
      defaultContactNmlsId,
      defaultContactPhone,
      defaultContactEmail,
      defaultContactPhoto,
    } = body

    const settings = await prisma.verify_page_settings.upsert({
      where: { id: 1 },
      update: {
        ...(pageTitle !== undefined && { page_title: pageTitle }),
        ...(pageSubtitle !== undefined && { page_subtitle: pageSubtitle }),
        ...(successTitle !== undefined && { success_title: successTitle }),
        ...(successMessage !== undefined && { success_message: successMessage }),
        ...(failTitle !== undefined && { fail_title: failTitle }),
        ...(failMessage !== undefined && { fail_message: failMessage }),
        ...(defaultContactName !== undefined && { default_contact_name: defaultContactName }),
        ...(defaultContactNmlsId !== undefined && { default_contact_nmls_id: defaultContactNmlsId || null }),
        ...(defaultContactPhone !== undefined && { default_contact_phone: defaultContactPhone }),
        ...(defaultContactEmail !== undefined && { default_contact_email: defaultContactEmail }),
        ...(defaultContactPhoto !== undefined && { default_contact_photo: defaultContactPhoto }),
        updated_at: new Date(),
      },
      create: {
        id: 1,
        page_title: pageTitle,
        page_subtitle: pageSubtitle,
        success_title: successTitle,
        success_message: successMessage,
        fail_title: failTitle,
        fail_message: failMessage,
        default_contact_name: defaultContactName,
        default_contact_nmls_id: defaultContactNmlsId,
        default_contact_phone: defaultContactPhone,
        default_contact_email: defaultContactEmail,
        default_contact_photo: defaultContactPhoto,
      },
    })

    return successResponse({
      pageTitle: settings.page_title,
      pageSubtitle: settings.page_subtitle,
      successTitle: settings.success_title,
      successMessage: settings.success_message,
      failTitle: settings.fail_title,
      failMessage: settings.fail_message,
      defaultContactName: settings.default_contact_name,
      defaultContactNmlsId: settings.default_contact_nmls_id,
      defaultContactPhone: settings.default_contact_phone,
      defaultContactEmail: settings.default_contact_email,
      defaultContactPhoto: settings.default_contact_photo,
    })
  } catch (error) {
    console.error('Error updating verify page settings:', error)
    return errorResponse('Failed to update verify page settings')
  }
}
