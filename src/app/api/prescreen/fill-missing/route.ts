import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { decrypt } from '@/lib/encryption'
import {
  submitRecords,
  formatRecordForAltair,
  computeMiddleScore,
  computeTier,
  createProgram as createAltairProgram,
  getProgram as getAltairProgram,
} from '@/lib/services/altair'

const BUREAUS = ['eq', 'tu', 'ex'] as const

// Criteria-only fields that Altair rejects as outputs
const CRITERIA_ONLY_FIELDS = new Set([
  'bk_flag', 'bk_flag_c13', 'bk_flag_60mons', 'bk_flag_72mons', 'bk_flag_84mons', 'fc_flag',
])

/**
 * Find or create a single-bureau Altair program for filling missing scores.
 * Clones the main program's full Altair structure, keeping only the target bureau enabled.
 */
async function getOrCreateFillProgram(bureau: string) {
  const name = `Fill - ${bureau.toUpperCase()} Only`

  // Check local DB first
  let program = await prisma.prescreen_programs.findFirst({
    where: { name, status: 'active' },
  })

  if (program?.altair_program_id) {
    return program
  }

  // Find main program with Altair ID to use as template
  const mainProgram = await prisma.prescreen_programs.findFirst({
    where: {
      status: 'active',
      altair_program_id: { not: null },
    },
    orderBy: { created_at: 'asc' },
  })

  if (!mainProgram?.altair_program_id) {
    console.error('[FILL] No main program with Altair ID found')
    return null
  }

  // Fetch the full Altair program structure
  const mainAltairResult = await getAltairProgram(mainProgram.altair_program_id)
  if (!mainAltairResult.success || !mainAltairResult.program) {
    console.error('[FILL] Failed to fetch main program from Altair:', mainAltairResult.error)
    return null
  }

  const mainConfig = (mainProgram.altair_config as any) || {}
  const scoreVersionKey = `${bureau}ScoreVersion`
  const scoreVersion = mainConfig[scoreVersionKey] || mainConfig.eqScoreVersion || 'FICO_CLASSIC'

  // Clone the full Altair program, modify for single bureau
  // Altair docs: "Use 'priority' for one bureau programs"
  // bureau_priority uses uppercase bureau names: "EQ", "TU", "EX"
  const template = mainAltairResult.program as any
  const bureauUpper = bureau.toUpperCase()
  const payload: any = {
    ...template,
    name,
    description: `Single-bureau fill program: ${bureauUpper} only`,
    match_mode: 'priority',
    bureau_priority: {
      bureau_1: bureauUpper,
      bureau_2: null,
      bureau_3: null,
    },
    eq_enabled: bureau === 'eq',
    tu_enabled: bureau === 'tu',
    ex_enabled: bureau === 'ex',
    eq_credit_score_version: bureau === 'eq' ? scoreVersion : null,
    tu_credit_score_version: bureau === 'tu' ? scoreVersion : null,
    ex_credit_score_version: bureau === 'ex' ? scoreVersion : null,
  }

  // Remove read-only and incompatible fields
  delete payload.id
  delete payload.created_at
  delete payload.updated_at
  delete payload.min_bureau_matches
  delete payload.credit_score_mode

  // Adjust segments: only keep criteria/outputs for the target bureau
  if (payload.segments && Array.isArray(payload.segments)) {
    // Keep main program's min score (500) — firm offer requires qualifying scores
    for (const segment of payload.segments) {
      if (segment.criteria) {
        for (const b of BUREAUS) {
          if (b === bureau) {
            // Keep this bureau's existing criteria as-is (inherits from main program)
            if (!segment.criteria[b]?.credit_score) {
              segment.criteria[b] = { ...segment.criteria[b], credit_score: { min: 500, max: 850 } }
            }
          } else {
            // Remove criteria for disabled bureaus
            delete segment.criteria[b]
          }
        }
      }
      if (segment.outputs) {
        for (const b of BUREAUS) {
          if (b !== bureau) {
            delete segment.outputs[b]
          }
        }
        // Ensure target bureau has outputs
        if (!segment.outputs[bureau]) {
          const desiredOutputs = (mainConfig.outputs as string[] | undefined)
            ?.filter((f: string) => !CRITERIA_ONLY_FIELDS.has(f))
          if (desiredOutputs) {
            const outputMap: Record<string, boolean> = {}
            for (const field of desiredOutputs) outputMap[field] = true
            segment.outputs[bureau] = outputMap
          }
        }
      }
    }
  }

  console.log(`[FILL] Creating ${bureau.toUpperCase()} program on Altair:`, JSON.stringify(payload, null, 2))

  const altairResult = await createAltairProgram(payload)
  const altairProgramId = altairResult.success ? altairResult.program?.id ?? null : null

  if (!altairProgramId) {
    console.error(`[FILL] Failed to create ${bureau} program on Altair:`, altairResult.error)
  }

  if (program) {
    program = await prisma.prescreen_programs.update({
      where: { id: program.id },
      data: {
        altair_program_id: altairProgramId,
        altair_config: {
          singleBureau: bureau,
          isFillProgram: true,
          outputs: mainConfig.outputs,
          [scoreVersionKey]: scoreVersion,
        },
        updated_at: new Date(),
      },
    })
  } else {
    program = await prisma.prescreen_programs.create({
      data: {
        altair_program_id: altairProgramId,
        name,
        description: `Single-bureau fill program: ${bureau.toUpperCase()} only`,
        min_score: 300,
        max_score: 850,
        eq_enabled: bureau === 'eq',
        tu_enabled: bureau === 'tu',
        ex_enabled: bureau === 'ex',
        altair_config: {
          singleBureau: bureau,
          isFillProgram: true,
          outputs: mainConfig.outputs,
          [scoreVersionKey]: scoreVersion,
        },
      },
    })
  }

  if (!program.altair_program_id) {
    return null
  }

  return program
}

/**
 * Shared scan: find leads with at least one bureau hit but missing other bureaus.
 */
async function scanMissingBureaus() {
  const leads = await prisma.prescreen_leads.findMany({
    where: {
      match_status: 'matched',
      ssn_encrypted: { not: null },
      dob_encrypted: { not: null },
    },
    include: {
      results: { select: { bureau: true, credit_score: true, is_hit: true } },
    },
    orderBy: { id: 'asc' },
  })

  const missingByBureau: Record<string, typeof leads> = { eq: [], tu: [], ex: [] }
  const leadsWithMissing: any[] = []

  for (const lead of leads) {
    const existingBureaus = new Set(lead.results.map(r => r.bureau))
    const missingBureaus = BUREAUS.filter(b => !existingBureaus.has(b))

    if (missingBureaus.length === 0) continue

    const existingScores: Record<string, number | null> = {}
    for (const r of lead.results) {
      existingScores[r.bureau] = r.credit_score
    }

    const leadInfo = {
      id: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      tier: lead.tier,
      middleScore: lead.middle_score,
      existingScores,
      missingBureaus,
    }

    leadsWithMissing.push(leadInfo)
    for (const bureau of missingBureaus) {
      missingByBureau[bureau].push(lead)
    }
  }

  return { leads, missingByBureau, leadsWithMissing }
}

// GET - Preview leads with missing bureaus
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { missingByBureau, leadsWithMissing } = await scanMissingBureaus()

    return successResponse({
      summary: {
        totalLeadsWithMissing: leadsWithMissing.length,
        missingEq: missingByBureau.eq.length,
        missingTu: missingByBureau.tu.length,
        missingEx: missingByBureau.ex.length,
      },
      leads: leadsWithMissing,
    })
  } catch (error) {
    console.error('Error scanning missing bureaus:', error)
    return errorResponse('Failed to scan missing bureaus')
  }
}

// POST - Execute fill for missing bureaus
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    // Optional: filter to specific lead IDs or per-lead bureau selections
    let selectedIds: number[] | null = null
    let selections: Record<number, string[]> | null = null
    try {
      const body = await request.json()
      if (body.selections && typeof body.selections === 'object') {
        // New format: { selections: { [leadId]: ['eq','tu','ex'] } }
        selections = {}
        for (const [id, bureaus] of Object.entries(body.selections)) {
          selections[Number(id)] = bureaus as string[]
        }
        selectedIds = Object.keys(selections).map(Number)
      } else if (body.leadIds && Array.isArray(body.leadIds)) {
        selectedIds = body.leadIds
      }
    } catch {
      // No body or invalid JSON — fill all
    }

    const { missingByBureau } = await scanMissingBureaus()

    const results: Record<string, any> = {}
    let totalUpdated = 0

    for (const bureau of BUREAUS) {
      let bureauLeads = missingByBureau[bureau]
      if (selectedIds) {
        bureauLeads = bureauLeads.filter(l => selectedIds!.includes(l.id))
      }
      // If per-lead bureau selections provided, only include leads that selected this bureau
      if (selections) {
        bureauLeads = bureauLeads.filter(l => selections![l.id]?.includes(bureau))
      }

      if (bureauLeads.length === 0) {
        results[bureau] = { submitted: 0, qualified: 0, failed: 0 }
        continue
      }

      // Get or create single-bureau program
      const fillProgram = await getOrCreateFillProgram(bureau)
      if (!fillProgram) {
        results[bureau] = {
          submitted: 0, qualified: 0, failed: 0,
          error: 'Failed to create single-bureau program on Altair',
        }
        continue
      }

      // Decrypt PII and format for Altair
      const altairRecords: ReturnType<typeof formatRecordForAltair>[] = []
      const leadMap = new Map<number, typeof bureauLeads[0]>()

      for (let i = 0; i < bureauLeads.length; i++) {
        const lead = bureauLeads[i]
        const inputId = i + 1
        leadMap.set(inputId, lead)

        let ssn = ''
        let dob = ''
        try {
          if (lead.ssn_encrypted) ssn = decrypt(lead.ssn_encrypted)
          if (lead.dob_encrypted) dob = decrypt(lead.dob_encrypted)
        } catch (e) {
          console.error(`Failed to decrypt PII for lead ${lead.id}:`, e)
          continue
        }

        altairRecords.push(formatRecordForAltair({
          firstName: lead.first_name,
          lastName: lead.last_name,
          middleInitial: lead.middle_initial || undefined,
          address: lead.address || undefined,
          address2: lead.address_2 || undefined,
          city: lead.city || undefined,
          state: lead.state || undefined,
          zip: lead.zip || undefined,
          ssn,
          dob,
        }, inputId))
      }

      if (altairRecords.length === 0) {
        results[bureau] = { submitted: 0, qualified: 0, failed: 0, error: 'No records could be prepared' }
        continue
      }

      // Create a batch for tracking, store lead IDs for click-through
      const batchLeadIds = bureauLeads.map(l => l.id)
      const batch = await prisma.prescreen_batches.create({
        data: {
          program_id: fillProgram.id,
          name: `Fill ${bureau.toUpperCase()} - ${new Date().toLocaleDateString()}`,
          status: 'processing',
          total_records: altairRecords.length,
          lead_ids: batchLeadIds,
          submitted_by: auth.session.userId,
          submitted_by_email: auth.session.email,
          submitted_at: new Date(),
        },
      })

      // Submit to Altair
      const submitResult = await submitRecords(fillProgram.altair_program_id!, altairRecords)

      let qualified = 0
      let failed = 0

      if (submitResult.success || submitResult.qualified.length > 0 || submitResult.failed.length > 0) {
        // Process qualified records: merge new bureau data
        for (const q of submitResult.qualified) {
          const lead = leadMap.get(q.input_id)
          if (!lead) continue

          const bureauOutput = q.outputs?.[bureau as 'eq' | 'tu' | 'ex']
          const score = bureauOutput?.credit_score ?? null

          // Upsert bureau result
          await prisma.prescreen_results.upsert({
            where: { lead_id_bureau: { lead_id: lead.id, bureau } },
            create: {
              lead_id: lead.id,
              bureau,
              credit_score: score,
              is_hit: !!bureauOutput,
              raw_output: bureauOutput ? (bureauOutput as any) : Prisma.DbNull,
            },
            update: {
              credit_score: score,
              is_hit: !!bureauOutput,
              raw_output: bureauOutput ? (bureauOutput as any) : Prisma.DbNull,
            },
          })

          // Recalculate middle score and tier with all bureaus
          const allResults = await prisma.prescreen_results.findMany({
            where: { lead_id: lead.id },
            select: { bureau: true, credit_score: true },
          })

          const scores = [
            allResults.find(r => r.bureau === 'eq')?.credit_score ?? null,
            allResults.find(r => r.bureau === 'tu')?.credit_score ?? null,
            allResults.find(r => r.bureau === 'ex')?.credit_score ?? null,
          ]

          const middleScore = computeMiddleScore(scores)
          const validScores = scores.filter((s): s is number => s != null)
          const tierScore = middleScore ?? (validScores.length > 0 ? Math.max(...validScores) : null)
          const tier = computeTier(tierScore)

          await prisma.prescreen_leads.update({
            where: { id: lead.id },
            data: {
              middle_score: middleScore,
              tier,
              is_qualified: tier === 'tier_1' || tier === 'tier_2',
              updated_at: new Date(),
            },
          })

          qualified++
          totalUpdated++
        }

        // Process failed: mark bureau as checked with no data
        for (const f of submitResult.failed) {
          const lead = leadMap.get(f.input_id)
          if (!lead) continue

          await prisma.prescreen_results.upsert({
            where: { lead_id_bureau: { lead_id: lead.id, bureau } },
            create: {
              lead_id: lead.id,
              bureau,
              credit_score: null,
              is_hit: false,
              raw_output: Prisma.DbNull,
            },
            update: {
              credit_score: null,
              is_hit: false,
            },
          })

          failed++
        }

        // Update batch status — submission succeeded even if 0 qualified (no match ≠ failure)
        const batchStatus = 'completed'
        await prisma.prescreen_batches.update({
          where: { id: batch.id },
          data: {
            status: batchStatus,
            qualified_count: qualified,
            failed_count: failed,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        })
      } else {
        // Complete Altair failure
        failed = altairRecords.length
        await prisma.prescreen_batches.update({
          where: { id: batch.id },
          data: {
            status: 'failed',
            error_message: submitResult.error,
            failed_count: failed,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        })
      }

      results[bureau] = {
        submitted: altairRecords.length,
        qualified,
        failed,
        batchId: batch.id,
        error: submitResult.error || null,
      }
    }

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        action: 'fill_missing_bureaus',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        details: { results, totalUpdated },
      },
    })

    return successResponse({ results, totalUpdated })
  } catch (error) {
    console.error('Error filling missing bureaus:', error)
    return errorResponse('Failed to fill missing bureaus')
  }
}
