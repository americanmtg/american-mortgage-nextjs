import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET - List all giveaways (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeStats = searchParams.get('includeStats') === 'true'
    const archived = searchParams.get('archived')

    const where: any = {}
    if (status) {
      where.status = status
    }

    // Filter by archived status
    if (archived === 'true') {
      where.archived = true
    } else {
      // By default, exclude archived giveaways
      where.OR = [
        { archived: false },
        { archived: null },
      ]
    }

    const giveaways = await prisma.giveaways.findMany({
      where,
      orderBy: [{ position: 'asc' }, { created_at: 'desc' }],
      include: includeStats ? {
        _count: {
          select: {
            entries: true,
            winners: true,
          },
        },
      } : undefined,
    })

    const items = giveaways.map(g => ({
      id: g.id,
      title: g.title,
      slug: g.slug,
      description: g.description,
      rules: g.rules,
      prizeTitle: g.prize_title,
      prizeValue: g.prize_value ? Number(g.prize_value) : null,
      prizeDescription: g.prize_description,
      prizeImage: g.prize_image,
      startDate: g.start_date,
      endDate: g.end_date,
      drawingDate: g.drawing_date,
      numWinners: g.num_winners,
      alternateWinners: g.alternate_winners,
      alternateSelection: g.alternate_selection,
      requireW9: g.require_w9,
      w9Threshold: g.w9_threshold ? Number(g.w9_threshold) : 600,
      restrictedStates: g.restricted_states,
      status: g.status,
      winnerSelected: g.winner_selected,
      archived: g.archived,
      deletedAt: g.deleted_at,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      position: g.position,
      ...(includeStats && '_count' in g ? {
        entryCount: (g as any)._count.entries,
        winnerCount: (g as any)._count.winners,
      } : {}),
    }))

    return successResponse({ items })
  } catch (error) {
    console.error('Error fetching giveaways:', error)
    return errorResponse('Failed to fetch giveaways')
  }
}

// POST - Create new giveaway
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  // Only admins can create giveaways
  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can create giveaways', 403)
  }

  try {
    const body = await request.json()
    const {
      title,
      slug: providedSlug,
      description,
      rules,
      prizeTitle,
      prizeValue,
      prizeDescription,
      prizeImage,
      detailImage,
      startDate,
      endDate,
      drawingDate,
      numWinners,
      alternateWinners,
      alternateSelection,
      requireW9,
      w9Threshold,
      restrictedStates,
      status,
      entryType,
      bonusEntriesEnabled,
      bonusEntryCount,
      requireId,
      // Button customization
      buttonText,
      buttonColor,
      buttonIcon,
      // Delivery method
      deliveryMethod,
    } = body

    // Validation
    if (!title) {
      return errorResponse('Title is required', 400)
    }
    if (!prizeTitle) {
      return errorResponse('Prize title is required', 400)
    }
    if (!startDate) {
      return errorResponse('Start date is required', 400)
    }
    if (!endDate) {
      return errorResponse('End date is required', 400)
    }

    // Generate or use provided slug
    let slug = providedSlug || generateSlug(title)

    // Check for existing slug
    const existingSlug = await prisma.giveaways.findUnique({
      where: { slug },
    })
    if (existingSlug) {
      // Add a unique suffix
      slug = `${slug}-${Date.now()}`
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'ended', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    // Validate alternate selection
    const validAlternateSelections = ['auto', 'manual']
    if (alternateSelection && !validAlternateSelections.includes(alternateSelection)) {
      return errorResponse(`Invalid alternate selection. Must be one of: ${validAlternateSelections.join(', ')}`, 400)
    }

    const giveaway = await prisma.giveaways.create({
      data: {
        title,
        slug,
        description: description || null,
        rules: rules || null,
        prize_title: prizeTitle,
        prize_value: prizeValue || null,
        prize_description: prizeDescription || null,
        prize_image: prizeImage || null,
        detail_image: detailImage || null,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        drawing_date: drawingDate ? new Date(drawingDate) : null,
        num_winners: numWinners || 1,
        alternate_winners: alternateWinners ?? 3,
        alternate_selection: alternateSelection || 'auto',
        require_w9: requireW9 ?? false,
        w9_threshold: w9Threshold ?? 600,
        restricted_states: restrictedStates || [],
        status: status || 'draft',
        entry_type: entryType || 'both',
        bonus_entries_enabled: bonusEntriesEnabled ?? false,
        bonus_entry_count: bonusEntryCount ?? 1,
        require_id: requireId ?? false,
        // Button customization
        button_text: buttonText || 'Enter Now',
        button_color: buttonColor || '#2563eb',
        button_icon: buttonIcon || 'ticket',
        // Delivery method
        delivery_method: deliveryMethod || 'email',
      },
    })

    return successResponse({
      id: giveaway.id,
      title: giveaway.title,
      slug: giveaway.slug,
      description: giveaway.description,
      rules: giveaway.rules,
      prizeTitle: giveaway.prize_title,
      prizeValue: giveaway.prize_value ? Number(giveaway.prize_value) : null,
      prizeDescription: giveaway.prize_description,
      prizeImage: giveaway.prize_image,
      startDate: giveaway.start_date,
      endDate: giveaway.end_date,
      drawingDate: giveaway.drawing_date,
      numWinners: giveaway.num_winners,
      alternateWinners: giveaway.alternate_winners,
      alternateSelection: giveaway.alternate_selection,
      requireW9: giveaway.require_w9,
      w9Threshold: giveaway.w9_threshold ? Number(giveaway.w9_threshold) : 600,
      restrictedStates: giveaway.restricted_states,
      status: giveaway.status,
      winnerSelected: giveaway.winner_selected,
      createdAt: giveaway.created_at,
      updatedAt: giveaway.updated_at,
    }, 201)
  } catch (error) {
    console.error('Error creating giveaway:', error)
    return errorResponse('Failed to create giveaway')
  }
}
