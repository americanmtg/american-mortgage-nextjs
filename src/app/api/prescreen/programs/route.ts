import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { createProgram as createAltairProgram, listPrograms } from '@/lib/services/altair'

// GET - List all programs
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const programs = await prisma.prescreen_programs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            leads: true,
            batches: true,
          },
        },
      },
    })

    const items = programs.map((p) => ({
      id: p.id,
      altairProgramId: p.altair_program_id,
      name: p.name,
      description: p.description,
      minScore: p.min_score,
      maxScore: p.max_score,
      status: p.status,
      eqEnabled: p.eq_enabled,
      exEnabled: p.ex_enabled,
      tuEnabled: p.tu_enabled,
      filterCriteria: p.altair_config || null,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      leadCount: p._count.leads,
      batchCount: p._count.batches,
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching prescreen programs:', error)
    return errorResponse('Failed to fetch programs')
  }
}

// POST - Create a new program
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Admin access required', 403)
  }

  try {
    const body = await request.json()
    const { name, description, minScore, maxScore, eqEnabled, exEnabled, tuEnabled, eqScoreVersion, tuScoreVersion, exScoreVersion, filterCriteria } = body

    if (!name) {
      return errorResponse('Program name is required', 400)
    }

    // Create on Altair first
    const altairResult = await createAltairProgram({
      name,
      description,
      min_score: minScore ?? 500,
      max_score: maxScore ?? 850,
      eq_enabled: eqEnabled ?? true,
      ex_enabled: exEnabled ?? false,
      tu_enabled: tuEnabled ?? true,
      eq_score_version: eqScoreVersion || 'FICO_CLASSIC',
      tu_score_version: tuScoreVersion || 'FICO_CLASSIC',
      ex_score_version: exScoreVersion || 'FICO_CLASSIC',
    })

    // Store locally (even if Altair call fails, we save with null altair_program_id)
    const program = await prisma.prescreen_programs.create({
      data: {
        altair_program_id: altairResult.success ? altairResult.program?.id : null,
        name,
        description: description || null,
        min_score: minScore ?? 500,
        max_score: maxScore ?? 850,
        eq_enabled: eqEnabled ?? true,
        ex_enabled: exEnabled ?? false,
        tu_enabled: tuEnabled ?? true,
        altair_config: {
          ...(filterCriteria || {}),
          eqScoreVersion: eqScoreVersion || 'FICO_CLASSIC',
          tuScoreVersion: tuScoreVersion || 'FICO_CLASSIC',
          exScoreVersion: exScoreVersion || 'FICO_CLASSIC',
        },
        created_by: auth.session.userId,
      },
    })

    // Audit log
    await prisma.prescreen_audit_log.create({
      data: {
        action: 'create_program',
        performed_by: auth.session.userId,
        performed_by_email: auth.session.email,
        details: {
          programId: program.id,
          altairProgramId: program.altair_program_id,
          altairSuccess: altairResult.success,
          altairError: altairResult.error || null,
        },
      },
    })

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
      altairConfigured: altairResult.success,
      altairError: altairResult.error || null,
      createdAt: program.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating prescreen program:', error)
    return errorResponse('Failed to create program')
  }
}
