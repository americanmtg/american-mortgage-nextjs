import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { submitRecords, formatRecordForAltair, computeMiddleScore, computeTier } from '@/lib/services/altair'
import { encrypt, decrypt, getLastFourSsn } from '@/lib/encryption'

// POST - Retry a failed batch by resubmitting api_error leads to Altair
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const body = await request.json()
    const { batchId } = body as { batchId: number }

    if (!batchId) return errorResponse('batchId is required', 400)

    // Fetch batch
    const batch = await prisma.prescreen_batches.findUnique({
      where: { id: batchId },
      include: { program: true },
    })
    if (!batch) return errorResponse('Batch not found', 404)
    if (batch.status !== 'failed') {
      return errorResponse('Only failed batches can be retried', 400)
    }

    // Fetch leads that had api_error
    const errorLeads = await prisma.prescreen_leads.findMany({
      where: { batch_id: batchId, match_status: 'api_error' },
      orderBy: { input_id: 'asc' },
    })

    if (errorLeads.length === 0) {
      return errorResponse('No failed leads to retry in this batch', 400)
    }

    // Verify program is still active
    const program = batch.program
    if (!program || program.status !== 'active') {
      return errorResponse('Program is no longer active', 400)
    }
    if (!program.altair_program_id) {
      return errorResponse('Program has no Altair program ID', 400)
    }

    // Rebuild records from DB, decrypting PII
    const records = errorLeads.map((lead) => {
      let ssn: string | undefined
      let dob: string | undefined

      if (lead.ssn_encrypted) {
        try { ssn = decrypt(lead.ssn_encrypted) } catch { /* skip */ }
      }
      if (lead.dob_encrypted) {
        try { dob = decrypt(lead.dob_encrypted) } catch { /* skip */ }
      }

      return {
        leadId: lead.id,
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
      }
    })

    // Format for Altair
    const altairRecords = records.map((r, idx) =>
      formatRecordForAltair(r, idx + 1),
    )

    // Mark batch as processing
    await prisma.prescreen_batches.update({
      where: { id: batchId },
      data: { status: 'processing', error_message: null, updated_at: new Date() },
    })

    // Submit to Altair
    const result = await submitRecords(program.altair_program_id, altairRecords)

    if (!result.success) {
      // Still failing — update batch error but keep existing leads
      await prisma.prescreen_batches.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          error_message: `Retry failed: ${result.error}`,
          updated_at: new Date(),
        },
      })

      // Audit log the retry attempt
      await prisma.prescreen_audit_log.create({
        data: {
          batch_id: batchId,
          action: 'batch_retry_failed',
          performed_by: auth.session.userId,
          performed_by_email: auth.session.email,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
          details: { error: result.error, recordCount: errorLeads.length },
        },
      })

      return errorResponse(`Retry failed: ${result.error}`)
    }

    // Success — delete old api_error leads and their results
    const oldLeadIds = errorLeads.map((l) => l.id)
    await prisma.prescreen_results.deleteMany({ where: { lead_id: { in: oldLeadIds } } })
    await prisma.prescreen_audit_log.updateMany({
      where: { lead_id: { in: oldLeadIds } },
      data: { lead_id: null },
    })
    await prisma.prescreen_leads.deleteMany({ where: { id: { in: oldLeadIds } } })

    let qualifiedCount = 0
    let failedCount = 0

    // Process qualified records
    for (const q of result.qualified) {
      const originalRecord = records[(q.input_id || 1) - 1]
      if (!originalRecord) continue

      const eqScore = q.outputs?.eq?.credit_score ?? null
      const tuScore = q.outputs?.tu?.credit_score ?? null
      const exScore = q.outputs?.ex?.credit_score ?? null
      const middleScore = computeMiddleScore([eqScore, tuScore, exScore])

      const validScores = [eqScore, tuScore, exScore].filter((s): s is number => s != null)
      const tierScore = middleScore ?? (validScores.length > 0 ? Math.max(...validScores) : null)
      const tier = computeTier(tierScore)

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

      const lead = await prisma.prescreen_leads.create({
        data: {
          batch_id: batchId,
          program_id: program.id,
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
          batch_id: batchId,
          program_id: program.id,
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

    // Update batch with final counts
    const finalStatus =
      failedCount === 0 ? 'completed' :
      qualifiedCount === 0 ? 'failed' : 'partial'

    await prisma.prescreen_batches.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        qualified_count: qualifiedCount,
        failed_count: failedCount,
        error_message: null,
        completed_at: new Date(),
        updated_at: new Date(),
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        batch_id: batchId,
        action: 'batch_retried',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
        details: {
          programId: program.id,
          batchId,
          totalRecords: records.length,
          qualifiedCount,
          failedCount,
          retryStatus: finalStatus,
        },
      },
    })

    return successResponse({
      batchId,
      totalRetried: records.length,
      qualifiedCount,
      failedCount,
      status: finalStatus,
    })
  } catch (error) {
    console.error('Error retrying prescreen batch:', error)
    return errorResponse('Failed to retry batch')
  }
}
