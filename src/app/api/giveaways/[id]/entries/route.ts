import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - List entries for a giveaway (admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const validOnly = searchParams.get('validOnly') === 'true'
    const search = searchParams.get('search') || ''

    const where: any = { giveaway_id: giveawayId }
    if (validOnly) {
      where.is_valid = true
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [entries, total] = await Promise.all([
      prisma.giveaway_entries.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          winner: {
            select: {
              id: true,
              winner_type: true,
              status: true,
            },
          },
          // Get referrals where this entry is the referrer
          referrals_as_referrer: {
            include: {
              referred_entry: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  created_at: true,
                },
              },
            },
          },
        },
      }),
      prisma.giveaway_entries.count({ where }),
    ])

    // Get giveaway to calculate bonus entry breakdown
    const giveaway = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
      select: { bonus_entry_count: true, referral_bonus_entries: true },
    })

    const items = entries.map(e => {
      // Calculate entry breakdown
      const baseEntries = 1
      const bonusEntries = e.bonus_claimed ? (giveaway?.bonus_entry_count || 1) : 0
      // Count only successful referrals (where referred_entry_id is set)
      const successfulReferrals = e.referrals_as_referrer?.filter(r => r.referred_entry_id !== null) || []
      const referralCount = successfulReferrals.length
      const referralEntries = referralCount * (giveaway?.referral_bonus_entries || 1)

      // Determine display email - hide placeholder, use secondary_contact if available
      const isPlaceholderEmail = e.email?.includes('@placeholder.internal')
      const displayEmail = isPlaceholderEmail ? (e.secondary_contact || null) : e.email

      // Get this entry's referral code (if they have one)
      const myReferralCode = e.referrals_as_referrer?.[0]?.referral_code || null

      return {
        id: e.id,
        giveawayId: e.giveaway_id,
        email: displayEmail,
        phone: e.phone,
        firstName: e.first_name,
        lastName: e.last_name,
        state: e.state,
        zipCode: e.zip_code,
        smsOptIn: e.sms_opt_in,
        emailOptIn: e.email_opt_in,
        agreedToRules: e.agreed_to_rules,
        ipAddress: e.ip_address,
        entrySource: e.entry_source,
        referralCode: e.referral_code,
        isValid: e.is_valid,
        invalidationReason: e.invalidation_reason,
        createdAt: e.created_at,
        isWinner: e.winner.length > 0,
        winnerInfo: e.winner.length > 0 ? e.winner[0] : null,
        // New fields for entry breakdown
        entryCount: e.entry_count || 1,
        baseEntries,
        bonusEntries,
        bonusClaimed: e.bonus_claimed || false,
        secondaryContact: e.secondary_contact,
        referralEntries,
        // Referral info
        myReferralCode,
        referrals: successfulReferrals.map(r => ({
          id: r.referred_entry?.id,
          firstName: r.referred_entry?.first_name,
          lastName: r.referred_entry?.last_name,
          convertedAt: r.converted_at,
          bonusAwarded: r.bonus_entries_awarded,
        })),
      }
    })

    return successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return errorResponse('Failed to fetch entries')
  }
}

// PUT - Update an entry (invalidate/validate)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can update entries', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const body = await request.json()
    const { entryId, isValid, invalidationReason } = body

    if (!entryId) {
      return errorResponse('Entry ID is required', 400)
    }

    const entry = await prisma.giveaway_entries.findFirst({
      where: {
        id: entryId,
        giveaway_id: giveawayId,
      },
    })

    if (!entry) {
      return errorResponse('Entry not found', 404)
    }

    const updated = await prisma.giveaway_entries.update({
      where: { id: entryId },
      data: {
        is_valid: isValid ?? entry.is_valid,
        invalidation_reason: isValid === false ? invalidationReason : null,
      },
    })

    return successResponse({
      id: updated.id,
      isValid: updated.is_valid,
      invalidationReason: updated.invalidation_reason,
    })
  } catch (error) {
    console.error('Error updating entry:', error)
    return errorResponse('Failed to update entry')
  }
}
