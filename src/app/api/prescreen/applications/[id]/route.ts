import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { encrypt, getLastFourSsn } from '@/lib/encryption'

// PATCH - Update application (add SSN, DOB, edit fields, dismiss)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const appId = parseInt(id)
    if (isNaN(appId)) return errorResponse('Invalid application ID', 400)

    const app = await prisma.prescreen_applications.findUnique({
      where: { id: appId },
    })
    if (!app) return errorResponse('Application not found', 404)

    const body = await request.json()
    const updates: any = { updated_at: new Date() }

    // Handle SSN — encrypt before storing
    if (body.ssn) {
      const ssnClean = body.ssn.replace(/\D/g, '')
      if (ssnClean.length !== 9) {
        return errorResponse('SSN must be 9 digits', 400)
      }
      updates.ssn_encrypted = encrypt(ssnClean)
      updates.ssn_last_four = getLastFourSsn(ssnClean)
    }

    // Handle DOB — encrypt and store display value
    if (body.dob) {
      // Expect YYYY-MM-DD or MM/DD/YYYY
      let dobNormalized = body.dob.trim()
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dobNormalized)) {
        const [m, d, y] = dobNormalized.split('/')
        dobNormalized = `${y}-${m}-${d}`
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dobNormalized)) {
        return errorResponse('DOB must be YYYY-MM-DD or MM/DD/YYYY', 400)
      }
      updates.dob = dobNormalized
      updates.dob_encrypted = encrypt(dobNormalized)
    }

    // Other editable fields
    if (body.firstName) updates.first_name = body.firstName.trim()
    if (body.lastName) updates.last_name = body.lastName.trim()
    if (body.email) updates.email = body.email.trim()
    if (body.phone) updates.phone = body.phone.trim()
    if (body.address) updates.address = body.address.trim()
    if (body.address2 !== undefined) updates.address_2 = body.address2.trim()
    if (body.city) updates.city = body.city.trim()
    if (body.state) updates.state = body.state.trim().toUpperCase()
    if (body.zip) updates.zip = body.zip.trim()

    // Status changes
    if (body.status === 'dismissed' || body.status === 'pending') {
      updates.status = body.status
    }

    const updated = await prisma.prescreen_applications.update({
      where: { id: appId },
      data: updates,
    })

    return successResponse({
      id: updated.id,
      hasSsn: !!updated.ssn_encrypted,
      ssnLastFour: updated.ssn_last_four,
      hasDob: !!updated.dob_encrypted,
      status: updated.status,
    })
  } catch (error) {
    console.error('Error updating application:', error)
    return errorResponse('Failed to update application')
  }
}

// DELETE - Dismiss/remove an application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const appId = parseInt(id)
    if (isNaN(appId)) return errorResponse('Invalid application ID', 400)

    await prisma.prescreen_applications.update({
      where: { id: appId },
      data: { status: 'dismissed', updated_at: new Date() },
    })

    return successResponse({ dismissed: true })
  } catch (error) {
    console.error('Error dismissing application:', error)
    return errorResponse('Failed to dismiss application')
  }
}
