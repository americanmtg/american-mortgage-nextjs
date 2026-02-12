import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { updateProgram as updateAltairProgram, getProgram as getAltairProgram } from '@/lib/services/altair'

// GET - Single program detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const programId = parseInt(id)
    if (isNaN(programId)) return errorResponse('Invalid program ID', 400)

    const program = await prisma.prescreen_programs.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: { leads: true, batches: true },
        },
      },
    })

    if (!program) return errorResponse('Program not found', 404)

    // Optionally sync from Altair
    let altairData = null
    if (program.altair_program_id) {
      const altairResult = await getAltairProgram(program.altair_program_id)
      if (altairResult.success) altairData = altairResult.program
    }

    return successResponse({
      id: program.id,
      altairProgramId: program.altair_program_id,
      name: program.name,
      description: program.description,
      minScore: program.min_score,
      maxScore: program.max_score,
      status: program.status,
      eqEnabled: program.eq_enabled,
      exEnabled: program.ex_enabled,
      tuEnabled: program.tu_enabled,
      filterCriteria: program.altair_config || null,
      altairData,
      leadCount: program._count.leads,
      batchCount: program._count.batches,
      createdAt: program.created_at,
      updatedAt: program.updated_at,
    })
  } catch (error) {
    console.error('Error fetching prescreen program:', error)
    return errorResponse('Failed to fetch program')
  }
}

// PUT - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { id } = await params
    const programId = parseInt(id)
    if (isNaN(programId)) return errorResponse('Invalid program ID', 400)

    const existing = await prisma.prescreen_programs.findUnique({
      where: { id: programId },
    })
    if (!existing) return errorResponse('Program not found', 404)

    const body = await request.json()
    const { name, description, minScore, maxScore, eqEnabled, exEnabled, tuEnabled, eqScoreVersion, tuScoreVersion, exScoreVersion, status, filterCriteria } = body
    const existingConfig = (existing.altair_config as any) || {}

    // Update on Altair if we have an Altair ID
    let altairError = null
    if (existing.altair_program_id) {
      // Fetch current program from Altair to get full structure (match_mode, segments, etc.)
      const currentAltair = await getAltairProgram(existing.altair_program_id)
      if (currentAltair.success && currentAltair.program) {
        const altairProg = currentAltair.program as any
        // Merge our changes into the full Altair program structure
        const updatePayload = {
          ...altairProg,
          name: name || altairProg.name,
          eq_enabled: eqEnabled ?? altairProg.eq_enabled,
          ex_enabled: exEnabled ?? altairProg.ex_enabled,
          tu_enabled: tuEnabled ?? altairProg.tu_enabled,
          eq_credit_score_version: eqScoreVersion ?? existingConfig.eqScoreVersion ?? altairProg.eq_credit_score_version,
          tu_credit_score_version: tuScoreVersion ?? existingConfig.tuScoreVersion ?? altairProg.tu_credit_score_version,
          ex_credit_score_version: exScoreVersion ?? existingConfig.exScoreVersion ?? altairProg.ex_credit_score_version,
        }
        // Remove read-only fields that Altair won't accept back
        delete updatePayload.id
        delete updatePayload.created_at
        delete updatePayload.updated_at

        // Sync segment criteria and outputs for all enabled bureaus
        // Also expand outputs to include all fields from local altair_config.outputs
        // Filter out criteria-only fields that Altair won't accept as outputs
        const CRITERIA_ONLY_FIELDS = new Set([
          'bk_flag', 'bk_flag_c13', 'bk_flag_60mons', 'bk_flag_72mons', 'bk_flag_84mons',
          'fc_flag',
        ])
        const desiredOutputs = (existingConfig.outputs as string[] | undefined)
          ?.filter((f: string) => !CRITERIA_ONLY_FIELDS.has(f))
        if (updatePayload.segments && Array.isArray(updatePayload.segments)) {
          for (const segment of updatePayload.segments) {
            const bureaus = ['eq', 'tu', 'ex'] as const
            for (const bureau of bureaus) {
              const isEnabled = updatePayload[`${bureau}_enabled`]
              if (!isEnabled) continue

              // Ensure criteria exist (copy from another bureau if needed)
              if (!segment.criteria?.[bureau]) {
                const template = segment.criteria?.eq || segment.criteria?.tu || segment.criteria?.ex
                if (template) {
                  if (!segment.criteria) segment.criteria = {}
                  segment.criteria[bureau] = { ...template }
                }
              }

              // Build full outputs from local config's desired output list
              if (desiredOutputs && desiredOutputs.length > 0) {
                if (!segment.outputs) segment.outputs = {}
                const fullOutputs: Record<string, boolean> = {}
                for (const field of desiredOutputs) {
                  fullOutputs[field] = true
                }
                segment.outputs[bureau] = fullOutputs
              } else if (!segment.outputs?.[bureau]) {
                // Fallback: copy from another bureau
                const templateOut = segment.outputs?.eq || segment.outputs?.tu || segment.outputs?.ex
                if (templateOut) {
                  if (!segment.outputs) segment.outputs = {}
                  segment.outputs[bureau] = { ...templateOut }
                }
              }
            }
          }
        }

        console.log('[ALTAIR] Updating program with payload:', JSON.stringify(updatePayload, null, 2))
        const altairResult = await updateAltairProgram(existing.altair_program_id, updatePayload)
        if (!altairResult.success) altairError = altairResult.error
      } else {
        altairError = currentAltair.error || 'Failed to fetch current program from Altair'
      }
    }

    const updated = await prisma.prescreen_programs.update({
      where: { id: programId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        min_score: minScore !== undefined ? minScore : undefined,
        max_score: maxScore !== undefined ? maxScore : undefined,
        eq_enabled: eqEnabled !== undefined ? eqEnabled : undefined,
        ex_enabled: exEnabled !== undefined ? exEnabled : undefined,
        tu_enabled: tuEnabled !== undefined ? tuEnabled : undefined,
        status: status || undefined,
        altair_config: filterCriteria !== undefined
          ? {
              ...filterCriteria,
              eqScoreVersion: eqScoreVersion ?? existingConfig.eqScoreVersion ?? 'FICO_CLASSIC',
              tuScoreVersion: tuScoreVersion ?? existingConfig.tuScoreVersion ?? 'FICO_CLASSIC',
              exScoreVersion: exScoreVersion ?? existingConfig.exScoreVersion ?? 'FICO_CLASSIC',
            }
          : (eqScoreVersion || tuScoreVersion || exScoreVersion)
            ? {
                ...existingConfig,
                eqScoreVersion: eqScoreVersion ?? existingConfig.eqScoreVersion ?? 'FICO_CLASSIC',
                tuScoreVersion: tuScoreVersion ?? existingConfig.tuScoreVersion ?? 'FICO_CLASSIC',
                exScoreVersion: exScoreVersion ?? existingConfig.exScoreVersion ?? 'FICO_CLASSIC',
              }
            : undefined,
        updated_at: new Date(),
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        action: 'update_program',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        details: { programId, changes: body, altairError },
      },
    })

    return successResponse({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      minScore: updated.min_score,
      maxScore: updated.max_score,
      status: updated.status,
      eqEnabled: updated.eq_enabled,
      exEnabled: updated.ex_enabled,
      tuEnabled: updated.tu_enabled,
      altairError,
      updatedAt: updated.updated_at,
    })
  } catch (error) {
    console.error('Error updating prescreen program:', error)
    return errorResponse('Failed to update program')
  }
}

// DELETE - Soft delete (set status to inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const { id } = await params
    const programId = parseInt(id)
    if (isNaN(programId)) return errorResponse('Invalid program ID', 400)

    const program = await prisma.prescreen_programs.findUnique({
      where: { id: programId },
    })
    if (!program) return errorResponse('Program not found', 404)

    await prisma.prescreen_programs.update({
      where: { id: programId },
      data: { status: 'inactive', updated_at: new Date() },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        action: 'deactivate_program',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        details: { programId },
      },
    })

    return successResponse({ message: 'Program deactivated' })
  } catch (error) {
    console.error('Error deactivating prescreen program:', error)
    return errorResponse('Failed to deactivate program')
  }
}
