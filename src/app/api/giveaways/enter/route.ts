import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEntryConfirmation } from '@/lib/notifications/email'
import { sendEntryConfirmationSms } from '@/lib/notifications/sms'
import crypto from 'crypto'

// Generate unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

// Helper to normalize phone number
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// Helper to check rate limit
async function checkRateLimit(identifier: string, identifierType: string, action: string, maxCount: number, windowMinutes: number): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  // Get count in current window
  const count = await prisma.rate_limits.count({
    where: {
      identifier,
      identifier_type: identifierType,
      action,
      window_start: { gte: windowStart },
    },
  })

  if (count >= maxCount) {
    return false // Rate limited
  }

  // Add new entry
  await prisma.rate_limits.create({
    data: {
      identifier,
      identifier_type: identifierType,
      action,
      window_start: now,
      window_end: new Date(now.getTime() + windowMinutes * 60 * 1000),
    },
  })

  return true
}

// POST - Submit entry (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      giveawayId,
      giveawaySlug,
      email,
      phone,
      firstName,
      lastName,
      state,
      zipCode,
      smsOptIn,
      agreedToRules,
      entrySource,
      referralCode,
      secondaryContact,
    } = body

    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const userAgent = request.headers.get('user-agent') || ''

    // Get giveaway first to determine entry_type requirements
    let giveaway
    if (giveawayId) {
      giveaway = await prisma.giveaways.findUnique({
        where: { id: giveawayId },
      })
    } else if (giveawaySlug) {
      giveaway = await prisma.giveaways.findUnique({
        where: { slug: giveawaySlug },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Giveaway ID or slug is required' },
        { status: 400 }
      )
    }

    if (!giveaway) {
      return NextResponse.json(
        { success: false, error: 'Giveaway not found' },
        { status: 404 }
      )
    }

    // Determine required fields based on entry_type
    const entryType = giveaway.entry_type || 'both'
    const requiresPhone = entryType === 'phone' || entryType === 'both'
    const requiresEmail = entryType === 'email' || entryType === 'both'

    // Basic validation
    if (!firstName || !lastName || !state) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and state are required' },
        { status: 400 }
      )
    }

    // Validate based on entry_type
    if (requiresPhone && !phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (requiresEmail && !email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Phone format validation (if provided)
    let normalizedPhone = ''
    if (phone) {
      normalizedPhone = normalizePhone(phone)
      if (normalizedPhone.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number. Please enter a 10-digit US phone number' },
          { status: 400 }
        )
      }
    }

    // Email format validation (if provided)
    let normalizedEmail = ''
    if (email) {
      normalizedEmail = email.toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // State validation
    const normalizedState = state.toUpperCase()
    if (!US_STATES.includes(normalizedState)) {
      return NextResponse.json(
        { success: false, error: 'Invalid state. Please select a valid US state' },
        { status: 400 }
      )
    }

    // Must agree to rules
    if (!agreedToRules) {
      return NextResponse.json(
        { success: false, error: 'You must agree to the official rules to enter' },
        { status: 400 }
      )
    }

    // Check giveaway is active
    if (giveaway.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This giveaway is not currently accepting entries' },
        { status: 400 }
      )
    }

    // Check dates
    const now = new Date()
    if (now < giveaway.start_date) {
      return NextResponse.json(
        { success: false, error: 'This giveaway has not started yet' },
        { status: 400 }
      )
    }
    if (now > giveaway.end_date) {
      return NextResponse.json(
        { success: false, error: 'This giveaway has ended' },
        { status: 400 }
      )
    }

    // Check state restrictions
    if (giveaway.restricted_states.length > 0 && giveaway.restricted_states.includes(normalizedState)) {
      return NextResponse.json(
        { success: false, error: 'Sorry, this giveaway is not available in your state' },
        { status: 400 }
      )
    }

    // Check if already unsubscribed
    const unsubscribeConditions: any[] = []
    if (normalizedEmail) {
      unsubscribeConditions.push({ email: normalizedEmail, channel: { in: ['email', 'both'] } })
    }
    if (normalizedPhone) {
      unsubscribeConditions.push({ phone: normalizedPhone, channel: { in: ['sms', 'both'] } })
    }

    if (unsubscribeConditions.length > 0) {
      const isUnsubscribed = await prisma.giveaway_unsubscribes.findFirst({
        where: {
          AND: [
            { OR: unsubscribeConditions },
            {
              OR: [
                { unsubscribe_type: 'all' },
                { giveaway_id: giveaway.id },
              ],
            },
          ],
        },
      })

      if (isUnsubscribed) {
        return NextResponse.json(
          { success: false, error: 'This email or phone has been unsubscribed from giveaways' },
          { status: 400 }
        )
      }
    }

    // Rate limiting - max 5 entries per IP per hour
    const ipAllowed = await checkRateLimit(ipAddress, 'ip', 'entry', 5, 60)
    if (!ipAllowed) {
      return NextResponse.json(
        { success: false, error: 'Too many entries from this location. Please try again later' },
        { status: 429 }
      )
    }

    // Check for duplicate entry by email (if email provided)
    if (normalizedEmail) {
      const existingEmail = await prisma.giveaway_entries.findFirst({
        where: {
          giveaway_id: giveaway.id,
          email: normalizedEmail,
        },
      })
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'You have already entered this giveaway! Use "Already entered? Check your entries" to view your current entries.', alreadyEntered: true },
          { status: 400 }
        )
      }
    }

    // Check for duplicate entry by phone (if phone provided)
    if (normalizedPhone) {
      const existingPhone = await prisma.giveaway_entries.findFirst({
        where: {
          giveaway_id: giveaway.id,
          phone: normalizedPhone,
        },
      })
      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: 'You have already entered this giveaway! Use "Already entered? Check your entries" to view your current entries.', alreadyEntered: true },
          { status: 400 }
        )
      }
    }

    // Calculate initial entry count - check if they're providing secondary contact
    let entryCount = 1
    let bonusClaimed = false
    let normalizedSecondary = ''

    if (secondaryContact && giveaway.bonus_entries_enabled) {
      // Determine secondary contact type based on entry_type
      // If entry_type is 'phone', secondary is email and vice versa
      if (entryType === 'phone') {
        // Secondary is email
        normalizedSecondary = secondaryContact.toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(normalizedSecondary)) {
          entryCount = 1 + (giveaway.bonus_entry_count || 1)
          bonusClaimed = true
        }
      } else if (entryType === 'email') {
        // Secondary is phone
        normalizedSecondary = normalizePhone(secondaryContact)
        if (normalizedSecondary.length === 10) {
          entryCount = 1 + (giveaway.bonus_entry_count || 1)
          bonusClaimed = true
        }
      }
    }

    // For entry_type 'phone', we need a placeholder email for the unique constraint
    // For entry_type 'email', we need a placeholder phone for the unique constraint
    const finalEmail = normalizedEmail || `phone_${normalizedPhone}@placeholder.internal`
    const finalPhone = normalizedPhone || `0000000000`

    // Create entry
    const entry = await prisma.giveaway_entries.create({
      data: {
        giveaway_id: giveaway.id,
        email: finalEmail,
        phone: finalPhone,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        state: normalizedState,
        zip_code: zipCode || null,
        sms_opt_in: smsOptIn ?? false,
        email_opt_in: !!normalizedEmail,
        agreed_to_rules: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        entry_source: entrySource || 'website',
        referral_code: referralCode || null,
        entry_count: entryCount,
        bonus_claimed: bonusClaimed,
        secondary_contact: normalizedSecondary || null,
      },
    })

    // Send entry confirmation email (if email provided)
    if (normalizedEmail) {
      const endDateFormatted = giveaway.end_date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      sendEntryConfirmation({
        email: normalizedEmail,
        firstName: firstName.trim(),
        giveawayTitle: giveaway.title,
        prizeTitle: giveaway.prize_title,
        endDate: endDateFormatted,
        giveawayId: giveaway.id,
        entryId: entry.id,
      }).catch(err => console.error('[ENTRY] Failed to send confirmation email:', err))
    }

    // Send SMS if opted in and phone provided
    if (smsOptIn && normalizedPhone) {
      sendEntryConfirmationSms({
        phone: normalizedPhone,
        firstName: firstName.trim(),
        prizeTitle: giveaway.prize_title,
        giveawayId: giveaway.id,
        entryId: entry.id,
      }).catch(err => console.error('[ENTRY] Failed to send confirmation SMS:', err))
    }

    // Process incoming referral code (award bonus to referrer)
    let referralProcessed = false
    if (referralCode && giveaway.referral_enabled) {
      try {
        // Find the referral record
        const referral = await prisma.giveaway_referrals.findFirst({
          where: {
            referral_code: referralCode,
            giveaway_id: giveaway.id,
            referred_entry_id: null, // not yet converted
          },
          include: {
            referrer_entry: true,
          },
        })

        if (referral && referral.referrer_entry) {
          // Check if referrer hasn't hit max referral bonus
          const totalReferralBonus = await prisma.giveaway_referrals.count({
            where: {
              referrer_entry_id: referral.referrer_entry_id,
              referred_entry_id: { not: null },
            },
          })

          const maxReferralBonus = giveaway.max_referral_bonus || 10

          // Check IP limit (max 3 referrals from same IP to same referrer)
          const sameIpReferrals = await prisma.giveaway_referrals.count({
            where: {
              referrer_entry_id: referral.referrer_entry_id,
              referred_ip: ipAddress,
              referred_entry_id: { not: null },
            },
          })

          const maxReferralsPerIp = giveaway.max_referrals_per_ip || 3

          if (totalReferralBonus < maxReferralBonus && sameIpReferrals < maxReferralsPerIp) {
            const bonusAmount = giveaway.referral_bonus_entries || 1

            // Award bonus to referrer
            await prisma.giveaway_entries.update({
              where: { id: referral.referrer_entry_id },
              data: {
                entry_count: { increment: bonusAmount },
              },
            })

            // Mark referral as converted
            await prisma.giveaway_referrals.update({
              where: { id: referral.id },
              data: {
                referred_entry_id: entry.id,
                referred_ip: ipAddress,
                bonus_entries_awarded: bonusAmount,
                converted_at: new Date(),
              },
            })

            referralProcessed = true
            console.log(`[REFERRAL] Awarded ${bonusAmount} bonus entries to entry ${referral.referrer_entry_id}`)
          }
        }
      } catch (refErr) {
        console.error('[REFERRAL] Error processing referral:', refErr)
        // Don't fail the entry if referral processing fails
      }
    }

    // Generate referral code for this entry if referrals are enabled
    let newReferralCode = null
    if (giveaway.referral_enabled) {
      try {
        // Generate unique code with retry
        let attempts = 0
        while (attempts < 3) {
          const code = generateReferralCode()
          try {
            await prisma.giveaway_referrals.create({
              data: {
                giveaway_id: giveaway.id,
                referrer_entry_id: entry.id,
                referral_code: code,
              },
            })
            newReferralCode = code
            break
          } catch (dupErr: any) {
            if (dupErr.code === 'P2002') {
              attempts++
              continue // Code collision, try again
            }
            throw dupErr
          }
        }
      } catch (refErr) {
        console.error('[REFERRAL] Error creating referral code:', refErr)
        // Don't fail the entry if referral code creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: bonusClaimed
        ? `You have been entered with ${entryCount} entries (including bonus)!`
        : 'You have been entered into the giveaway!',
      entryId: entry.id,
      entryCount,
      bonusClaimed,
      canClaimBonus: giveaway.bonus_entries_enabled && !bonusClaimed,
      referralCode: newReferralCode,
      referralEnabled: giveaway.referral_enabled,
      referralBonusEntries: giveaway.referral_bonus_entries || 1,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error submitting entry:', error)

    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'You have already entered this giveaway! Use "Already entered? Check your entries" to view your current entries.', alreadyEntered: true },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to submit entry. Please try again' },
      { status: 500 }
    )
  }
}
