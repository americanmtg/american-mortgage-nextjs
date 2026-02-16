import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

const ARIVE_API_KEY = process.env.ARIVE_API_KEY || ''
const ARIVE_BASE = process.env.ARIVE_API_BASE_URL || 'https://americanmtg.myarive.com'

interface AriveBorrower {
  firstName?: string
  lastName?: string
  emailAddressText?: string
  mobilePhone10digit?: string
  applicantType?: string
  monthOfBirth?: string
  dayOfBirth?: string
  currentResidence?: {
    addressLineText?: string
    addressUnitIdentifier?: string
    city?: string
    state?: string
    postalCode?: string
  }
}

interface AriveLoan {
  ariveLoanId: number
  loanPurpose?: string
  mortgageType?: string
  baseLoanAmount?: number
  createDateTime?: string
  loanBorrowers?: AriveBorrower[]
}

// POST - Import historical loans from Arive API
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response
  if (auth.session.role !== 'admin') return errorResponse('Admin access required', 403)

  if (!ARIVE_API_KEY) return errorResponse('Arive API key not configured', 500)

  try {
    const body = await request.json().catch(() => ({}))
    const sinceDate = body.since || '2026-01-01'
    const cutoff = new Date(sinceDate)

    let imported = 0
    let skipped = 0
    let total = 0
    let offset = 0
    const limit = 100
    let keepGoing = true

    while (keepGoing) {
      const url = `${ARIVE_BASE}/api/loans?limit=${limit}&offset=${offset}&orderBy=createdAt&sort=DESC`
      const res = await fetch(url, {
        headers: { 'X-API-KEY': ARIVE_API_KEY },
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        return errorResponse(`Arive API error ${res.status}: ${errText}`, 500)
      }

      const data = await res.json()
      const rows: AriveLoan[] = data.rows || []
      total = data.count || 0

      if (rows.length === 0) break

      for (const loan of rows) {
        const createdAt = loan.createDateTime ? new Date(loan.createDateTime) : null
        if (createdAt && createdAt < cutoff) {
          keepGoing = false
          break
        }

        const loanId = String(loan.ariveLoanId || '')
        const borrowers = loan.loanBorrowers || []
        if (borrowers.length === 0) {
          skipped++
          continue
        }

        // Need to get full details for address info
        let detailedBorrowers: AriveBorrower[] = borrowers
        try {
          const detailRes = await fetch(`${ARIVE_BASE}/api/loans/${loan.ariveLoanId}`, {
            headers: { 'X-API-KEY': ARIVE_API_KEY },
          })
          if (detailRes.ok) {
            const detail = await detailRes.json()
            detailedBorrowers = detail.loanBorrowers || borrowers
          }
        } catch {
          // Fall back to list data
        }

        for (const b of detailedBorrowers) {
          const firstName = (b.firstName || '').trim()
          const lastName = (b.lastName || '').trim()
          if (!firstName || !lastName) continue

          const residence = b.currentResidence || {}
          const address = (residence.addressLineText || '').trim()
          const city = (residence.city || '').trim()
          const state = (residence.state || '').trim().toUpperCase()
          const zip = (residence.postalCode || '').trim().replace(/\D/g, '').slice(0, 5)

          // Must have address for prescreening
          if (!address || !city || !state || !zip) {
            skipped++
            continue
          }

          const borrowerType = b.applicantType === 'CoBorrower' ? 'coborrower' : 'primary'
          const email = (b.emailAddressText || '').trim()
          const phone = (b.mobilePhone10digit || '').trim()

          let dob = ''
          if (b.monthOfBirth && b.dayOfBirth) {
            const mm = String(b.monthOfBirth).padStart(2, '0')
            const dd = String(b.dayOfBirth).padStart(2, '0')
            dob = `${mm}/${dd}`
          }

          // Dedup: skip if already exists
          const existing = await prisma.prescreen_applications.findFirst({
            where: {
              first_name: { equals: firstName, mode: 'insensitive' },
              last_name: { equals: lastName, mode: 'insensitive' },
              source_loan_id: loanId,
            },
            select: { id: true },
          })

          if (existing) {
            skipped++
            continue
          }

          await prisma.prescreen_applications.create({
            data: {
              source: 'arive',
              source_loan_id: loanId,
              borrower_type: borrowerType,
              first_name: firstName,
              last_name: lastName,
              email: email || null,
              phone: phone || null,
              address,
              address_2: (residence.addressUnitIdentifier || '').trim() || null,
              city,
              state,
              zip,
              dob: dob || null,
              loan_amount: loan.baseLoanAmount || null,
              loan_purpose: loan.loanPurpose || null,
              loan_type: loan.mortgageType || null,
            },
          })

          imported++
        }
      }

      offset += limit

      // Safety: don't loop forever
      if (offset > total + 100) break
    }

    return successResponse({
      imported,
      skipped,
      totalLoansInArive: total,
      since: sinceDate,
    })
  } catch (error: any) {
    console.error('Arive import error:', error)
    return errorResponse(`Import failed: ${error.message}`)
  }
}
