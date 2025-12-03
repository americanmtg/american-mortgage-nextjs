import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Helper to normalize phone number
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

// POST - Claim bonus entry by providing secondary contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entryId, giveawayId, secondaryContact, secondaryContactType } = body

    if (!entryId || !giveawayId) {
      return NextResponse.json(
        { success: false, error: 'Entry ID and Giveaway ID are required' },
        { status: 400 }
      )
    }

    if (!secondaryContact) {
      return NextResponse.json(
        { success: false, error: 'Secondary contact is required' },
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

    // Check if bonus entries are enabled
    if (!giveaway.bonus_entries_enabled) {
      return NextResponse.json(
        { success: false, error: 'Bonus entries are not enabled for this giveaway' },
        { status: 400 }
      )
    }

    // Check giveaway is still active
    const now = new Date()
    if (giveaway.status !== 'active' || now > giveaway.end_date) {
      return NextResponse.json(
        { success: false, error: 'This giveaway is no longer accepting entries' },
        { status: 400 }
      )
    }

    // Get entry
    const entry = await prisma.giveaway_entries.findFirst({
      where: {
        id: entryId,
        giveaway_id: giveawayId,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      )
    }

    // Check if bonus already claimed
    if (entry.bonus_claimed) {
      return NextResponse.json(
        { success: false, error: 'Bonus entry has already been claimed' },
        { status: 400 }
      )
    }

    // Validate secondary contact
    let normalizedSecondary = secondaryContact
    if (secondaryContactType === 'phone') {
      normalizedSecondary = normalizePhone(secondaryContact)
      if (normalizedSecondary.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number' },
          { status: 400 }
        )
      }
      // Check if same as primary
      if (normalizedSecondary === entry.phone) {
        return NextResponse.json(
          { success: false, error: 'Secondary contact must be different from primary contact' },
          { status: 400 }
        )
      }
    } else if (secondaryContactType === 'email') {
      normalizedSecondary = secondaryContact.toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedSecondary)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      // Check if same as primary
      if (normalizedSecondary === entry.email.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'Secondary contact must be different from primary contact' },
          { status: 400 }
        )
      }
    }

    // Calculate new entry count
    const bonusEntries = giveaway.bonus_entry_count || 1
    const newEntryCount = (entry.entry_count || 1) + bonusEntries

    // Update entry with bonus
    const updatedEntry = await prisma.giveaway_entries.update({
      where: { id: entryId },
      data: {
        entry_count: newEntryCount,
        bonus_claimed: true,
        secondary_contact: normalizedSecondary,
        // Also update the secondary field (email/phone) if it was empty
        ...(secondaryContactType === 'email' && !entry.email ? { email: normalizedSecondary } : {}),
        ...(secondaryContactType === 'phone' && !entry.phone ? { phone: normalizedSecondary } : {}),
        // Set opt-in for the contact type being added
        ...(secondaryContactType === 'email' ? { email_opt_in: true } : {}),
        ...(secondaryContactType === 'phone' ? { sms_opt_in: true } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      message: `You earned ${bonusEntries} bonus ${bonusEntries === 1 ? 'entry' : 'entries'}!`,
      entry: {
        id: updatedEntry.id,
        entryCount: updatedEntry.entry_count,
        bonusClaimed: true,
      },
    })

  } catch (error: any) {
    console.error('Error claiming bonus entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to claim bonus entry' },
      { status: 500 }
    )
  }
}
