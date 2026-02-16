import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { submitRecords, formatRecordForAltair, computeMiddleScore, computeTier } from '@/lib/services/altair'
import { encrypt, getLastFourSsn } from '@/lib/encryption'

interface SubmitRecord {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn?: string;
  dob?: string;
}

// POST - Submit records for prescreening
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const body = await request.json()
    let { programId, records, batchName } = body as {
      programId: number;
      records: SubmitRecord[];
      batchName?: string;
    }

    if (!programId) return errorResponse('programId is required', 400)
    if (!records || !Array.isArray(records) || records.length === 0) {
      return errorResponse('records array is required and must not be empty', 400)
    }
    if (records.length > 1000) {
      return errorResponse('Maximum 1000 records per submission', 400)
    }

    // Validate program
    const program = await prisma.prescreen_programs.findUnique({
      where: { id: programId },
    })
    if (!program) return errorResponse('Program not found', 404)
    if (program.status !== 'active') {
      return errorResponse('Program is not active', 400)
    }

    // Validate each record
    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      if (!r.firstName || !r.lastName) {
        return errorResponse(`Record ${i + 1}: firstName and lastName are required`, 400)
      }
      if (!r.address || !r.city || !r.state || !r.zip) {
        return errorResponse(`Record ${i + 1}: address, city, state, and zip are required`, 400)
      }
    }

    // Pre-submission dedup: skip people who already have scored results in this program
    const skipped: string[] = []
    const filteredRecords: SubmitRecord[] = []
    for (const r of records) {
      const existing = await prisma.prescreen_leads.findFirst({
        where: {
          program_id: programId,
          first_name: { equals: r.firstName.trim(), mode: 'insensitive' },
          last_name: { equals: r.lastName.trim(), mode: 'insensitive' },
          middle_score: { not: null },
          tier: { in: ['tier_1', 'tier_2', 'tier_3', 'below'] },
        },
        select: { id: true, middle_score: true, tier: true },
      })
      if (existing) {
        skipped.push(`${r.firstName} ${r.lastName} (already has score ${existing.middle_score}, lead #${existing.id})`)
      } else {
        filteredRecords.push(r)
      }
    }

    if (filteredRecords.length === 0) {
      return successResponse({
        message: 'All records already have scored results',
        skipped,
        batchId: null,
        qualifiedCount: 0,
        failedCount: 0,
      })
    }

    // Replace records with filtered list for submission
    records = filteredRecords

    // Create batch
    const batch = await prisma.prescreen_batches.create({
      data: {
        program_id: programId,
        name: batchName || `Batch ${new Date().toLocaleDateString()}`,
        status: 'processing',
        total_records: records.length,
        submitted_by: auth.session.userId,
        submitted_by_email: auth.session.email,
        submitted_at: new Date(),
      },
    })

    let qualifiedCount = 0
    let failedCount = 0

    // If Altair program ID exists, submit to Altair
    if (program.altair_program_id) {
      const altairRecords = records.map((r, idx) =>
        formatRecordForAltair(r, idx + 1),
      )

      const result = await submitRecords(program.altair_program_id, altairRecords)

      if (!result.success) {
        // Save all submitted records so user can see what was attempted
        for (let i = 0; i < records.length; i++) {
          const r = records[i]
          let ssnEncrypted = null
          let ssnLastFour = null
          let dobEncrypted = null

          if (r.ssn) {
            ssnEncrypted = encrypt(r.ssn)
            ssnLastFour = getLastFourSsn(r.ssn)
          }
          if (r.dob) {
            dobEncrypted = encrypt(r.dob)
          }

          await prisma.prescreen_leads.create({
            data: {
              batch_id: batch.id,
              program_id: programId,
              input_id: i + 1,
              first_name: r.firstName,
              last_name: r.lastName,
              middle_initial: r.middleInitial || null,
              address: r.address || null,
              address_2: r.address2 || null,
              city: r.city || null,
              state: r.state || null,
              zip: r.zip || null,
              ssn_encrypted: ssnEncrypted,
              ssn_last_four: ssnLastFour,
              dob_encrypted: dobEncrypted,
              tier: 'pending',
              match_status: 'api_error',
              error_message: result.error || 'API submission failed',
            },
          })
        }

        // Mark batch as failed
        await prisma.prescreen_batches.update({
          where: { id: batch.id },
          data: {
            status: 'failed',
            error_message: result.error,
            failed_count: records.length,
            completed_at: new Date(),
            updated_at: new Date(),
          },
        })

        return errorResponse(`Altair submission failed: ${result.error}`)
      }

      // Process qualified records
      for (const q of result.qualified) {
        const originalRecord = records[(q.input_id || 1) - 1]
        if (!originalRecord) continue

        const eqScore = q.outputs?.eq?.credit_score ?? null
        const tuScore = q.outputs?.tu?.credit_score ?? null
        const exScore = q.outputs?.ex?.credit_score ?? null
        const middleScore = computeMiddleScore([eqScore, tuScore, exScore])

        // For tiering: use middle score if all 3 exist, otherwise use highest available score
        const validScores = [eqScore, tuScore, exScore].filter((s): s is number => s != null)
        const tierScore = middleScore ?? (validScores.length > 0 ? Math.max(...validScores) : null)
        const tier = computeTier(tierScore)

        // Encrypt PII
        let ssnEncrypted = null
        let ssnLastFour = null
        let dobEncrypted = null

        if (originalRecord.ssn) {
          ssnEncrypted = encrypt(originalRecord.ssn)
          ssnLastFour = getLastFourSsn(originalRecord.ssn)
        }
        if (originalRecord.dob) {
          dobEncrypted = encrypt(originalRecord.dob)
        }

        // Create lead
        const lead = await prisma.prescreen_leads.create({
          data: {
            batch_id: batch.id,
            program_id: programId,
            input_id: q.input_id,
            first_name: originalRecord.firstName,
            last_name: originalRecord.lastName,
            middle_initial: originalRecord.middleInitial || null,
            address: originalRecord.address || null,
            address_2: originalRecord.address2 || null,
            city: originalRecord.city || null,
            state: originalRecord.state || null,
            zip: originalRecord.zip || null,
            ssn_encrypted: ssnEncrypted,
            ssn_last_four: ssnLastFour,
            dob_encrypted: dobEncrypted,
            middle_score: middleScore,
            tier,
            is_qualified: tier === 'tier_1' || tier === 'tier_2',
            match_status: 'matched',
            segment_name: q.segment_name || null,
          },
        })

        // Create bureau results
        const bureauEntries = [
          { bureau: 'eq', output: q.outputs?.eq, score: eqScore },
          { bureau: 'tu', output: q.outputs?.tu, score: tuScore },
          { bureau: 'ex', output: q.outputs?.ex, score: exScore },
        ]

        for (const b of bureauEntries) {
          // Save a row for every enabled bureau — is_hit distinguishes "got data" vs "checked but no data"
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

        qualifiedCount++
      }

      // Process failed records
      for (const f of result.failed) {
        const originalRecord = records[(f.input_id || 1) - 1]
        if (!originalRecord) continue

        let ssnEncrypted = null
        let ssnLastFour = null
        let dobEncrypted = null

        if (originalRecord.ssn) {
          ssnEncrypted = encrypt(originalRecord.ssn)
          ssnLastFour = getLastFourSsn(originalRecord.ssn)
        }
        if (originalRecord.dob) {
          dobEncrypted = encrypt(originalRecord.dob)
        }

        await prisma.prescreen_leads.create({
          data: {
            batch_id: batch.id,
            program_id: programId,
            input_id: f.input_id,
            first_name: originalRecord.firstName,
            last_name: originalRecord.lastName,
            middle_initial: originalRecord.middleInitial || null,
            address: originalRecord.address || null,
            address_2: originalRecord.address2 || null,
            city: originalRecord.city || null,
            state: originalRecord.state || null,
            zip: originalRecord.zip || null,
            ssn_encrypted: ssnEncrypted,
            ssn_last_four: ssnLastFour,
            dob_encrypted: dobEncrypted,
            tier: 'filtered',
            is_qualified: false,
            match_status: f.match ? 'matched' : 'no_match',
            error_message: f.match
              ? 'No bureau scores returned (all bureaus returned null outputs)'
              : f.error || f.reason || 'No match found',
          },
        })

        failedCount++
      }
    } else {
      // No Altair program ID — store records locally only (for manual processing)
      for (let i = 0; i < records.length; i++) {
        const r = records[i]
        let ssnEncrypted = null
        let ssnLastFour = null
        let dobEncrypted = null

        if (r.ssn) {
          ssnEncrypted = encrypt(r.ssn)
          ssnLastFour = getLastFourSsn(r.ssn)
        }
        if (r.dob) {
          dobEncrypted = encrypt(r.dob)
        }

        await prisma.prescreen_leads.create({
          data: {
            batch_id: batch.id,
            program_id: programId,
            input_id: i + 1,
            first_name: r.firstName,
            last_name: r.lastName,
            middle_initial: r.middleInitial || null,
            address: r.address || null,
            address_2: r.address2 || null,
            city: r.city || null,
            state: r.state || null,
            zip: r.zip || null,
            ssn_encrypted: ssnEncrypted,
            ssn_last_four: ssnLastFour,
            dob_encrypted: dobEncrypted,
            tier: 'pending',
            match_status: 'pending',
          },
        })
      }
    }

    // Dedup: clean up old api_error/pending leads for the same people in this program
    try {
      const nameKeys = records.map(r => ({
        first: r.firstName.trim().toLowerCase(),
        last: r.lastName.trim().toLowerCase(),
      }))

      // Find old leads with matching names that are stale (api_error or pending)
      const oldLeads = await prisma.prescreen_leads.findMany({
        where: {
          program_id: programId,
          batch_id: { not: batch.id },
          match_status: { in: ['api_error', 'pending'] },
          OR: nameKeys.map(n => ({
            first_name: { equals: n.first, mode: 'insensitive' as const },
            last_name: { equals: n.last, mode: 'insensitive' as const },
          })),
        },
        select: { id: true, batch_id: true },
      })

      if (oldLeads.length > 0) {
        const oldIds = oldLeads.map(l => l.id)

        // Clean up old leads and their results
        await prisma.prescreen_results.deleteMany({ where: { lead_id: { in: oldIds } } })
        await prisma.prescreen_audit_log.updateMany({
          where: { lead_id: { in: oldIds } },
          data: { lead_id: null },
        })
        await prisma.prescreen_leads.deleteMany({ where: { id: { in: oldIds } } })

        // Update old batch record counts
        const affectedBatchIds = Array.from(new Set(oldLeads.map(l => l.batch_id).filter(Boolean))) as number[]
        for (const oldBatchId of affectedBatchIds) {
          const remaining = await prisma.prescreen_leads.count({ where: { batch_id: oldBatchId } })
          if (remaining === 0) {
            await prisma.prescreen_batches.update({
              where: { id: oldBatchId },
              data: { total_records: 0, qualified_count: 0, failed_count: 0, updated_at: new Date() },
            })
          }
        }

        console.log(`Dedup: removed ${oldIds.length} old api_error/pending leads for resubmitted people`)
      }
    } catch (dedupErr) {
      // Non-fatal — log but don't fail the submission
      console.error('Dedup cleanup error (non-fatal):', dedupErr)
    }

    // Update batch with final counts
    const finalStatus =
      failedCount === 0 ? 'completed' :
      qualifiedCount === 0 ? 'failed' : 'partial'

    await prisma.prescreen_batches.update({
      where: { id: batch.id },
      data: {
        status: program.altair_program_id ? finalStatus : 'pending',
        qualified_count: qualifiedCount,
        failed_count: failedCount,
        completed_at: new Date(),
        updated_at: new Date(),
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        batch_id: batch.id,
        action: 'submit',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        details: {
          programId,
          batchId: batch.id,
          totalRecords: records.length,
          qualifiedCount,
          failedCount,
        },
      },
    })

    return successResponse({
      batchId: batch.id,
      totalSubmitted: records.length,
      qualifiedCount,
      failedCount,
      skipped: skipped.length > 0 ? skipped : undefined,
      status: program.altair_program_id ? finalStatus : 'pending',
    })
  } catch (error) {
    console.error('Error submitting prescreen records:', error)
    return errorResponse('Failed to submit records')
  }
}
