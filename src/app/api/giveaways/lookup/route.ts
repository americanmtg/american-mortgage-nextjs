import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// Helper to normalize phone number
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// Generate a unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

// POST - Look up entry by phone or email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { giveawayId, phone, email } = body

    if (!giveawayId) {
      return NextResponse.json(
        { success: false, error: 'Giveaway ID is required' },
        { status: 400 }
      )
    }

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'Phone or email is required' },
        { status: 400 }
      )
    }

    // Get giveaway
    const giveaway = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
    })

    if (!giveaway) {
      return NextResponse.json(
        { success: false, error: 'Giveaway not found' },
        { status: 404 }
      )
    }

    // Find entry
    let entry = null
    if (phone) {
      const normalizedPhone = normalizePhone(phone)
      entry = await prisma.giveaway_entries.findFirst({
        where: {
          giveaway_id: giveawayId,
          phone: normalizedPhone,
        },
      })
    } else if (email) {
      entry = await prisma.giveaway_entries.findFirst({
        where: {
          giveaway_id: giveawayId,
          email: email.toLowerCase(),
        },
      })
    }

    if (!entry) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'No entry found with this contact information',
      })
    }

    // Get or create referral code if referrals are enabled
    let referralCode = null
    let referralEntries = 0
    if (giveaway.referral_enabled) {
      // Check if referral code already exists
      let referral = await prisma.giveaway_referrals.findFirst({
        where: {
          giveaway_id: giveawayId,
          referrer_entry_id: entry.id,
        },
      })

      // If no referral code exists, create one
      if (!referral) {
        const newCode = generateReferralCode()
        referral = await prisma.giveaway_referrals.create({
          data: {
            giveaway_id: giveawayId,
            referrer_entry_id: entry.id,
            referral_code: newCode,
          },
        })
      }

      referralCode = referral.referral_code

      // Count successful referrals (where someone used this code)
      const successfulReferrals = await prisma.giveaway_referrals.count({
        where: {
          giveaway_id: giveawayId,
          referrer_entry_id: entry.id,
          referred_entry_id: { not: null },
        },
      })
      referralEntries = successfulReferrals * (giveaway.referral_bonus_entries || 1)
    }

    // Calculate bonus entries (from secondary contact)
    const bonusEntries = entry.bonus_claimed ? (giveaway.bonus_entry_count || 1) : 0

    // Return entry info
    return NextResponse.json({
      success: true,
      found: true,
      entry: {
        id: entry.id,
        firstName: entry.first_name,
        entryCount: entry.entry_count || 1,
        baseEntries: 1,
        bonusEntries,
        referralEntries,
        bonusClaimed: entry.bonus_claimed || false,
        hasSecondaryContact: !!entry.secondary_contact,
        createdAt: entry.created_at?.toISOString(),
        referralCode,
      },
      giveaway: {
        bonusEntriesEnabled: giveaway.bonus_entries_enabled,
        bonusEntryCount: giveaway.bonus_entry_count,
        entryType: giveaway.entry_type,
        referralEnabled: giveaway.referral_enabled,
        referralBonusEntries: giveaway.referral_bonus_entries || 1,
      },
    })

  } catch (error: any) {
    console.error('Error looking up entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to look up entry' },
      { status: 500 }
    )
  }
}
