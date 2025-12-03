import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET - Get single giveaway by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const giveaway = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
      include: {
        _count: {
          select: {
            entries: true,
            winners: true,
          },
        },
      },
    })

    if (!giveaway) {
      return errorResponse('Giveaway not found', 404)
    }

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
      detailImage: giveaway.detail_image,
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
      entryCount: giveaway._count.entries,
      winnerCount: giveaway._count.winners,
      // New fields
      entryType: giveaway.entry_type || 'both',
      primaryContact: giveaway.primary_contact || 'phone',
      bonusEntriesEnabled: giveaway.bonus_entries_enabled || false,
      bonusEntryCount: giveaway.bonus_entry_count || 1,
      requireId: giveaway.require_id || false,
      // Button customization
      buttonText: giveaway.button_text || 'Enter Now',
      buttonColor: giveaway.button_color || '#2563eb',
      buttonIcon: giveaway.button_icon || 'ticket',
      // Delivery method
      deliveryMethod: giveaway.delivery_method || 'email',
      // Fine print
      finePrint: giveaway.fine_print,
      // Referral settings
      referralEnabled: giveaway.referral_enabled || false,
      referralBonusEntries: giveaway.referral_bonus_entries || 1,
      maxReferralBonus: giveaway.max_referral_bonus || 10,
      maxReferralsPerIp: giveaway.max_referrals_per_ip || 3,
    })
  } catch (error) {
    console.error('Error fetching giveaway:', error)
    return errorResponse('Failed to fetch giveaway')
  }
}

// PUT - Update giveaway
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  // Only admins can update giveaways
  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can update giveaways', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const existing = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
    })

    if (!existing) {
      return errorResponse('Giveaway not found', 404)
    }

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
      // New fields
      entryType,
      primaryContact,
      bonusEntriesEnabled,
      bonusEntryCount,
      requireId,
      // Button customization
      buttonText,
      buttonColor,
      buttonIcon,
      // Delivery method
      deliveryMethod,
      // Fine print
      finePrint,
      // Referral settings
      referralEnabled,
      referralBonusEntries,
      maxReferralBonus,
      maxReferralsPerIp,
    } = body

    // Build update data
    const updateData: any = {
      updated_at: new Date(),
    }

    if (title !== undefined) {
      updateData.title = title
      // Update slug if title changed and no explicit slug provided
      if (!providedSlug && title !== existing.title) {
        let newSlug = generateSlug(title)
        // Check for conflicts
        const slugConflict = await prisma.giveaways.findFirst({
          where: {
            slug: newSlug,
            id: { not: giveawayId },
          },
        })
        if (slugConflict) {
          newSlug = `${newSlug}-${Date.now()}`
        }
        updateData.slug = newSlug
      }
    }

    if (providedSlug !== undefined) {
      // Check for conflicts
      const slugConflict = await prisma.giveaways.findFirst({
        where: {
          slug: providedSlug,
          id: { not: giveawayId },
        },
      })
      if (slugConflict) {
        return errorResponse('Slug already exists', 400)
      }
      updateData.slug = providedSlug
    }

    if (description !== undefined) updateData.description = description
    if (rules !== undefined) updateData.rules = rules
    if (prizeTitle !== undefined) updateData.prize_title = prizeTitle
    if (prizeValue !== undefined) updateData.prize_value = prizeValue
    if (prizeDescription !== undefined) updateData.prize_description = prizeDescription
    if (prizeImage !== undefined) updateData.prize_image = prizeImage
    if (detailImage !== undefined) updateData.detail_image = detailImage
    if (startDate !== undefined) updateData.start_date = new Date(startDate)
    if (endDate !== undefined) updateData.end_date = new Date(endDate)
    if (drawingDate !== undefined) updateData.drawing_date = drawingDate ? new Date(drawingDate) : null
    if (numWinners !== undefined) updateData.num_winners = numWinners
    if (alternateWinners !== undefined) updateData.alternate_winners = alternateWinners
    if (alternateSelection !== undefined) {
      const validAlternateSelections = ['auto', 'manual']
      if (!validAlternateSelections.includes(alternateSelection)) {
        return errorResponse(`Invalid alternate selection. Must be one of: ${validAlternateSelections.join(', ')}`, 400)
      }
      updateData.alternate_selection = alternateSelection
    }
    if (requireW9 !== undefined) updateData.require_w9 = requireW9
    if (w9Threshold !== undefined) updateData.w9_threshold = w9Threshold
    if (restrictedStates !== undefined) updateData.restricted_states = restrictedStates
    if (status !== undefined) {
      const validStatuses = ['draft', 'active', 'ended', 'cancelled']
      if (!validStatuses.includes(status)) {
        return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
      }
      updateData.status = status
    }
    // New fields
    if (entryType !== undefined) {
      const validEntryTypes = ['phone', 'email', 'both']
      if (!validEntryTypes.includes(entryType)) {
        return errorResponse(`Invalid entry type. Must be one of: ${validEntryTypes.join(', ')}`, 400)
      }
      updateData.entry_type = entryType
    }
    if (primaryContact !== undefined) {
      const validContacts = ['phone', 'email']
      if (!validContacts.includes(primaryContact)) {
        return errorResponse(`Invalid primary contact. Must be one of: ${validContacts.join(', ')}`, 400)
      }
      updateData.primary_contact = primaryContact
    }
    if (bonusEntriesEnabled !== undefined) updateData.bonus_entries_enabled = bonusEntriesEnabled
    if (bonusEntryCount !== undefined) updateData.bonus_entry_count = bonusEntryCount
    if (requireId !== undefined) updateData.require_id = requireId
    // Button customization
    if (buttonText !== undefined) updateData.button_text = buttonText
    if (buttonColor !== undefined) updateData.button_color = buttonColor
    if (buttonIcon !== undefined) updateData.button_icon = buttonIcon
    // Delivery method
    if (deliveryMethod !== undefined) {
      const validDeliveryMethods = ['email', 'physical']
      if (!validDeliveryMethods.includes(deliveryMethod)) {
        return errorResponse(`Invalid delivery method. Must be one of: ${validDeliveryMethods.join(', ')}`, 400)
      }
      updateData.delivery_method = deliveryMethod
    }
    // Fine print
    if (finePrint !== undefined) updateData.fine_print = finePrint
    // Referral settings
    if (referralEnabled !== undefined) updateData.referral_enabled = referralEnabled
    if (referralBonusEntries !== undefined) updateData.referral_bonus_entries = referralBonusEntries
    if (maxReferralBonus !== undefined) updateData.max_referral_bonus = maxReferralBonus
    if (maxReferralsPerIp !== undefined) updateData.max_referrals_per_ip = maxReferralsPerIp

    const giveaway = await prisma.giveaways.update({
      where: { id: giveawayId },
      data: updateData,
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
    })
  } catch (error) {
    console.error('Error updating giveaway:', error)
    return errorResponse('Failed to update giveaway')
  }
}

// DELETE - Soft delete giveaway (archives instead of hard delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  // Only admins can delete giveaways
  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can delete giveaways', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const existing = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
    })

    if (!existing) {
      return errorResponse('Giveaway not found', 404)
    }

    // Soft delete: Set deleted_at and archived flag
    await prisma.giveaways.update({
      where: { id: giveawayId },
      data: {
        deleted_at: new Date(),
        archived: true,
        status: 'cancelled',
        updated_at: new Date(),
      },
    })

    return successResponse({ deleted: true, archived: true, id: giveawayId })
  } catch (error) {
    console.error('Error deleting giveaway:', error)
    return errorResponse('Failed to delete giveaway')
  }
}
