import { requireAdmin, errorResponse, successResponse } from '@/lib/api-auth'
import { getAltairConfig, listPrograms } from '@/lib/services/altair'

// GET - Test Altair API connectivity
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.authenticated) return auth.response

  const config = getAltairConfig()

  if (!config.isConfigured) {
    return successResponse({
      status: 'not_configured',
      message: 'Altair API credentials not set. Check ALTAIR_BASE_URL, ALTAIR_USERNAME, ALTAIR_PASSWORD.',
    })
  }

  try {
    const start = Date.now()
    const result = await listPrograms()
    const latency = Date.now() - start

    if (!result.success) {
      const isBlocked = result.error?.includes('IP blocked') || result.error?.includes('firewall')
      return successResponse({
        status: isBlocked ? 'blocked' : 'error',
        message: result.error,
        latencyMs: latency,
        baseUrl: config.baseUrl,
        companyId: config.companyId,
      })
    }

    console.log('[ALTAIR] Programs from Altair:', JSON.stringify(result.programs, null, 2))

    return successResponse({
      status: 'connected',
      message: `Connected successfully. ${result.programs?.length || 0} program(s) found.`,
      latencyMs: latency,
      programCount: result.programs?.length || 0,
      programs: result.programs,
      baseUrl: config.baseUrl,
      companyId: config.companyId,
    })
  } catch (error: any) {
    return successResponse({
      status: 'error',
      message: error.message,
      baseUrl: config.baseUrl,
      companyId: config.companyId,
    })
  }
}
