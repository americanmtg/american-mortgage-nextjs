import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const WEBHOOK_SECRET = process.env.ARIVE_WEBHOOK_SECRET || ''

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

// Create or update a single application record
async function upsertApplication(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  address2: string
  city: string
  state: string
  zip: string
  dob: string
  loanAmount: any
  loanPurpose: string
  loanType: string
  sourceLoanId: string
  propertyAddress: string
  propertyCity: string
  propertyState: string
  propertyZip: string
  borrowerType: string
  source: string
  rawPayload: any
}) {
  const finalAddress = data.address || data.propertyAddress
  const finalCity = data.city || data.propertyCity
  const finalState = data.state || data.propertyState
  const finalZip = data.zip || data.propertyZip

  // Dedup: check if we already have a pending application for this person
  const existing = await prisma.prescreen_applications.findFirst({
    where: {
      first_name: { equals: data.firstName, mode: 'insensitive' },
      last_name: { equals: data.lastName, mode: 'insensitive' },
      status: 'pending',
    },
    select: { id: true },
  })

  if (existing) {
    await prisma.prescreen_applications.update({
      where: { id: existing.id },
      data: {
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        address_2: data.address2 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zip: data.zip || undefined,
        dob: data.dob || undefined,
        loan_amount: data.loanAmount ? parseFloat(data.loanAmount) : undefined,
        loan_purpose: data.loanPurpose || undefined,
        loan_type: data.loanType || undefined,
        property_address: data.propertyAddress || undefined,
        property_city: data.propertyCity || undefined,
        property_state: data.propertyState || undefined,
        property_zip: data.propertyZip || undefined,
        source_loan_id: data.sourceLoanId || undefined,
        borrower_type: data.borrowerType,
        raw_payload: data.rawPayload,
        updated_at: new Date(),
      },
    })
    return { id: existing.id, updated: true }
  }

  const application = await prisma.prescreen_applications.create({
    data: {
      source: data.source,
      source_loan_id: data.sourceLoanId || null,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      address: finalAddress || null,
      address_2: data.address2 || null,
      city: finalCity || null,
      state: finalState || null,
      zip: finalZip || null,
      dob: data.dob || null,
      loan_amount: data.loanAmount ? parseFloat(data.loanAmount) : null,
      loan_purpose: data.loanPurpose || null,
      loan_type: data.loanType || null,
      property_address: data.propertyAddress || null,
      property_city: data.propertyCity || null,
      property_state: data.propertyState || null,
      property_zip: data.propertyZip || null,
      borrower_type: data.borrowerType,
      raw_payload: data.rawPayload,
    },
  })
  return { id: application.id, updated: false }
}

// POST - Receive application data from Zapier (Arive trigger)
export async function POST(request: NextRequest) {
  try {
    // Validate webhook secret
    const secret = request.headers.get('x-webhook-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await request.json()

    // Debug logging
    console.log('=== ARIVE WEBHOOK RECEIVED ===')
    console.log('Keys:', Object.keys(body))
    console.log('Body:', JSON.stringify(body, null, 2))

    // --- Primary borrower ---
    const firstName = (body.first_name || body.firstName || body.borrower_first_name || '').trim()
    const lastName = (body.last_name || body.lastName || body.borrower_last_name || '').trim()
    const email = (body.email || body.borrower_email || '').trim()
    const phone = (body.phone || body.borrower_phone || '').trim()
    const address = (body.address || body.borrower_address || '').trim()
    const address2 = (body.address_2 || body.address2 || body.unit || body.apt || '').trim()
    const city = (body.city || body.borrower_city || '').trim()
    const state = (body.state || body.borrower_state || '').trim().toUpperCase()
    const zip = (body.zip || body.zip_code || body.borrower_zip || '').trim().replace(/\D/g, '').slice(0, 5)

    // DOB — Arive sends day and month separately (no year)
    let dob = (body.date_of_birth || body.dob || body.birthday || body.borrower_dob || '').trim()
    if (!dob && body.dob_month && body.dob_day) {
      const mm = String(body.dob_month).padStart(2, '0')
      const dd = String(body.dob_day).padStart(2, '0')
      dob = `${mm}/${dd}`
    }

    const loanAmount = body.loan_amount || body.loanAmount || null
    const loanPurpose = (body.loan_purpose || body.loanPurpose || body.purpose || '').trim()
    const loanType = (body.loan_type || body.loanType || '').trim()
    const sourceLoanId = (body.loan_id || body.loanId || body.id || '').toString().trim()

    // Property address
    const propertyAddress = (body.property_address || body.subject_property_address || '').trim()
    const propertyCity = (body.property_city || body.subject_property_city || '').trim()
    const propertyState = (body.property_state || body.subject_property_state || '').trim().toUpperCase()
    const propertyZip = (body.property_zip || body.subject_property_zip || '').trim().replace(/\D/g, '').slice(0, 5)

    // Validate primary borrower required fields
    if (!firstName || !lastName) {
      return jsonResponse({ error: 'Missing required fields: first_name, last_name' }, 422)
    }

    const hasAddress = (address && city && state && zip) || (propertyAddress && propertyCity && propertyState && propertyZip)
    if (!hasAddress) {
      return jsonResponse({ error: 'Missing required address fields (address, city, state, zip)' }, 422)
    }

    // Create primary borrower application
    const primary = await upsertApplication({
      firstName, lastName, email, phone,
      address, address2, city, state, zip, dob,
      loanAmount, loanPurpose, loanType, sourceLoanId,
      propertyAddress, propertyCity, propertyState, propertyZip,
      borrowerType: 'primary',
      source: 'arive',
      rawPayload: body,
    })

    // --- Co-borrower (if present) ---
    const coFirstName = (body.co_first_name || body.coborrower_first_name || '').trim()
    const coLastName = (body.co_last_name || body.coborrower_last_name || '').trim()

    let coResult = null
    if (coFirstName && coLastName) {
      const coEmail = (body.co_email || body.coborrower_email || '').trim()
      const coPhone = (body.co_phone || body.coborrower_phone || '').trim()
      const coAddress = (body.co_address || body.coborrower_address || '').trim()
      const coCity = (body.co_city || body.coborrower_city || '').trim()
      const coState = (body.co_state || body.coborrower_state || '').trim().toUpperCase()
      const coZip = (body.co_zip || body.coborrower_zip || '').trim().replace(/\D/g, '').slice(0, 5)

      let coDob = ''
      if (body.co_dob_month && body.co_dob_day) {
        const mm = String(body.co_dob_month).padStart(2, '0')
        const dd = String(body.co_dob_day).padStart(2, '0')
        coDob = `${mm}/${dd}`
      }

      // Co-borrower uses their own address if provided, otherwise falls back to primary borrower's address
      const coFinalAddress = coAddress || address
      const coFinalCity = coCity || city
      const coFinalState = coState || state
      const coFinalZip = coZip || zip

      if (coFinalAddress && coFinalCity && coFinalState && coFinalZip) {
        coResult = await upsertApplication({
          firstName: coFirstName,
          lastName: coLastName,
          email: coEmail,
          phone: coPhone,
          address: coFinalAddress,
          address2: '',
          city: coFinalCity,
          state: coFinalState,
          zip: coFinalZip,
          dob: coDob,
          loanAmount, loanPurpose, loanType, sourceLoanId,
          propertyAddress, propertyCity, propertyState, propertyZip,
          borrowerType: 'coborrower',
          source: 'arive',
          rawPayload: body,
        })
      }
    }

    return jsonResponse({
      success: true,
      primary: { applicationId: primary.id, updated: primary.updated },
      ...(coResult ? { coborrower: { applicationId: coResult.id, updated: coResult.updated } } : {}),
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
}

// GET - Health check for Zapier testing
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret') || new URL(request.url).searchParams.get('secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  return jsonResponse({ status: 'ok', message: 'Arive webhook endpoint is active' })
}
