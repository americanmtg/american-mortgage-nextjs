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
    const { programId, records, batchName } = body as {
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

        // For tiering: use middle score if available, otherwise use lowest available score (conservative)
        const validScores = [eqScore, tuScore, exScore].filter((s): s is number => s != null)
        const tierScore = middleScore ?? (validScores.length > 0 ? Math.min(...validScores) : null)
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
          if (b.output) {
            await prisma.prescreen_results.create({
              data: {
                lead_id: lead.id,
                bureau: b.bureau,
                credit_score: b.score,
                is_hit: true,
                raw_output: b.output as any,
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
            match_status: 'no_match',
            error_message: f.error || f.reason || 'No match found',
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
      status: program.altair_program_id ? finalStatus : 'pending',
    })
  } catch (error) {
    console.error('Error submitting prescreen records:', error)
    return errorResponse('Failed to submit records')
  }
}
