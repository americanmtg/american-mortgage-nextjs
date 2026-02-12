import { NextRequest } from 'next/server'
import { requireAdmin, errorResponse, successResponse } from '@/lib/api-auth'
import { getBillingReport } from '@/lib/services/altair'

// GET - Fetch billing report from Altair
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return errorResponse('startDate and endDate are required (YYYY-MM-DD)', 400)
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return errorResponse('Dates must be in YYYY-MM-DD format', 400)
    }

    const result = await getBillingReport(startDate, endDate)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to fetch billing report', 502)
    }

    return successResponse(result.records)
  } catch (error) {
    console.error('Error fetching billing report:', error)
    return errorResponse('Failed to fetch billing report')
  }
}
