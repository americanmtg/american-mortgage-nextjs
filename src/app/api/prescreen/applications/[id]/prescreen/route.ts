import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import {
  submitRecords,
  formatRecordForAltair,
  computeMiddleScore,
  computeTier,
} from '@/lib/services/altair'

// POST - Prescreen an incoming application (submit to Altair)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { id } = await params
    const appId = parseInt(id)
    if (isNaN(appId)) return errorResponse('Invalid application ID', 400)

    const app = await prisma.prescreen_applications.findUnique({
      where: { id: appId },
    })
    if (!app) return errorResponse('Application not found', 404)
    if (app.status === 'prescreened') {
      return errorResponse('Application already prescreened', 400)
    }

    // Must have SSN and DOB to prescreen
    if (!app.ssn_encrypted) {
      return errorResponse('SSN is required before prescreening', 400)
    }
    if (!app.dob_encrypted) {
      return errorResponse('DOB is required before prescreening', 400)
    }
    if (!app.address || !app.city || !app.state || !app.zip) {
      return errorResponse('Complete address is required', 400)
    }

    // Optionally accept a programId in the request body, otherwise use default
    let programId: number | undefined
    try {
      const body = await request.json()
      programId = body.programId
    } catch {
      // No body
    }

    // Find program — use provided or default "Standard Prescreen"
    const program = programId
      ? await prisma.prescreen_programs.findUnique({ where: { id: programId } })
      : await prisma.prescreen_programs.findFirst({
          where: { status: 'active', name: { contains: 'Standard', mode: 'insensitive' } },
          orderBy: { created_at: 'asc' },
        })

    if (!program) return errorResponse('No active prescreen program found', 400)
    if (!program.altair_program_id) {
      return errorResponse('Program has no Altair program ID', 400)
    }

    // Decrypt PII
    let ssn: string
    let dob: string
    try {
      ssn = decrypt(app.ssn_encrypted)
      dob = decrypt(app.dob_encrypted)
    } catch (e) {
      return errorResponse('Failed to decrypt PII', 500)
    }

    // Check for existing prescreen lead with same name + score (dedup)
    const existingLead = await prisma.prescreen_leads.findFirst({
      where: {
        program_id: program.id,
        first_name: { equals: app.first_name, mode: 'insensitive' },
        last_name: { equals: app.last_name, mode: 'insensitive' },
        middle_score: { not: null },
        tier: { in: ['tier_1', 'tier_2', 'tier_3', 'below'] },
      },
      select: { id: true, middle_score: true, tier: true },
    })

    if (existingLead) {
      // Link the application to the existing lead instead of re-running
      await prisma.prescreen_applications.update({
        where: { id: appId },
        data: {
          status: 'prescreened',
          prescreen_lead_id: existingLead.id,
          updated_at: new Date(),
        },
      })

      return successResponse({
        applicationId: appId,
        leadId: existingLead.id,
        middleScore: existingLead.middle_score,
        tier: existingLead.tier,
        alreadyExisted: true,
      })
    }

    // Format and submit to Altair
    const altairRecord = formatRecordForAltair({
      firstName: app.first_name,
      lastName: app.last_name,
      address: app.address,
      address2: app.address_2 || undefined,
      city: app.city,
      state: app.state,
      zip: app.zip,
      ssn,
      dob,
    }, 1)

    // Create a batch for tracking
    const batch = await prisma.prescreen_batches.create({
      data: {
        program_id: program.id,
        name: `App Import - ${app.first_name} ${app.last_name}`,
        status: 'processing',
        total_records: 1,
        submitted_by: auth.session.userId,
        submitted_by_email: auth.session.email,
        submitted_at: new Date(),
      },
    })

    const result = await submitRecords(program.altair_program_id, [altairRecord])

    let leadId: number | null = null
    let middleScore: number | null = null
    let tier: string | null = null

    if (result.qualified.length > 0) {
      const q = result.qualified[0]
      const eqScore = q.outputs?.eq?.credit_score ?? null
      const tuScore = q.outputs?.tu?.credit_score ?? null
      const exScore = q.outputs?.ex?.credit_score ?? null
      middleScore = computeMiddleScore([eqScore, tuScore, exScore])

      const validScores = [eqScore, tuScore, exScore].filter((s): s is number => s != null)
      const tierScore = middleScore ?? (validScores.length > 0 ? Math.max(...validScores) : null)
      tier = computeTier(tierScore)

      const lead = await prisma.prescreen_leads.create({
        data: {
          batch_id: batch.id,
          program_id: program.id,
          input_id: 1,
          first_name: app.first_name,
          last_name: app.last_name,
          address: app.address,
          address_2: app.address_2,
          city: app.city,
          state: app.state,
          zip: app.zip,
          ssn_encrypted: app.ssn_encrypted,
          ssn_last_four: app.ssn_last_four,
          dob_encrypted: app.dob_encrypted,
          middle_score: middleScore,
          tier: tier as any,
          is_qualified: tier === 'tier_1' || tier === 'tier_2',
          match_status: 'matched',
          segment_name: q.segment_name || null,
        },
      })

      leadId = lead.id

      // Create bureau results
      const bureauEntries = [
        { bureau: 'eq', output: q.outputs?.eq, score: eqScore },
        { bureau: 'tu', output: q.outputs?.tu, score: tuScore },
        { bureau: 'ex', output: q.outputs?.ex, score: exScore },
      ]

      for (const b of bureauEntries) {
        const wasChecked = q.outputs?.hasOwnProperty(b.bureau)
        if (b.output || wasChecked) {
          await prisma.prescreen_results.create({
            data: {
              lead_id: lead.id,
              bureau: b.bureau,
              credit_score: b.score,
              is_hit: !!b.output,
              raw_output: b.output ? (b.output as any) : null,
            },
          })
        }
      }

      // Update batch
      await prisma.prescreen_batches.update({
        where: { id: batch.id },
        data: {
          status: 'completed',
          qualified_count: 1,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      })
    } else if (result.failed.length > 0) {
      const f = result.failed[0]
      tier = 'filtered'

      const lead = await prisma.prescreen_leads.create({
        data: {
          batch_id: batch.id,
          program_id: program.id,
          input_id: 1,
          first_name: app.first_name,
          last_name: app.last_name,
          address: app.address,
          address_2: app.address_2,
          city: app.city,
          state: app.state,
          zip: app.zip,
          ssn_encrypted: app.ssn_encrypted,
          ssn_last_four: app.ssn_last_four,
          dob_encrypted: app.dob_encrypted,
          tier: 'filtered',
          is_qualified: false,
          match_status: f.match ? 'matched' : 'no_match',
          error_message: f.match
            ? 'No bureau scores returned (all bureaus returned null outputs)'
            : f.error || f.reason || 'No match found',
        },
      })

      leadId = lead.id

      await prisma.prescreen_batches.update({
        where: { id: batch.id },
        data: {
          status: 'completed',
          failed_count: 1,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      })
    } else {
      // Complete API failure
      await prisma.prescreen_batches.update({
        where: { id: batch.id },
        data: {
          status: 'failed',
          error_message: result.error || 'No results returned',
          failed_count: 1,
          completed_at: new Date(),
          updated_at: new Date(),
        },
      })

      return errorResponse(`Altair submission failed: ${result.error || 'No results'}`)
    }

    // Mark application as prescreened
    await prisma.prescreen_applications.update({
      where: { id: appId },
      data: {
        status: 'prescreened',
        prescreen_lead_id: leadId,
        updated_at: new Date(),
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        lead_id: leadId,
        batch_id: batch.id,
        action: 'application_prescreened',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        details: { applicationId: appId, source: app.source },
      },
    }).catch(() => {})

    return successResponse({
      applicationId: appId,
      leadId,
      middleScore,
      tier,
    })
  } catch (error) {
    console.error('Error prescreening application:', error)
    return errorResponse('Failed to prescreen application')
  }
}
