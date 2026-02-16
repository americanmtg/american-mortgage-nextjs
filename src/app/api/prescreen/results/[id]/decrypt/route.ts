import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

// POST - Decrypt SSN or DOB for authorized viewing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  // Admin-only
  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { id } = params
    const leadId = parseInt(id)
    if (isNaN(leadId)) return errorResponse('Invalid lead ID', 400)

    const body = await request.json()
    const { field } = body as { field: 'ssn' | 'dob' }

    if (!field || !['ssn', 'dob'].includes(field)) {
      return errorResponse('field must be "ssn" or "dob"', 400)
    }

    const lead = await prisma.prescreen_leads.findUnique({
      where: { id: leadId },
      select: {
        ssn_encrypted: true,
        dob_encrypted: true,
      },
    })

    if (!lead) return errorResponse('Lead not found', 404)

    const encryptedValue = field === 'ssn' ? lead.ssn_encrypted : lead.dob_encrypted
    if (!encryptedValue) {
      return errorResponse(`No ${field.toUpperCase()} on file`, 404)
    }

    const decryptedValue = decrypt(encryptedValue)

    // Audit log — fire-and-forget (don't block the response)
    prisma.prescreen_audit_log.create({
      data: {
        lead_id: leadId,
        action: field === 'ssn' ? 'decrypt_ssn' : 'decrypt_dob',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    }).catch(() => {})

    return successResponse({ value: decryptedValue })
  } catch (error) {
    console.error('Error decrypting prescreen field:', error)
    return errorResponse('Failed to decrypt field')
  }
}
