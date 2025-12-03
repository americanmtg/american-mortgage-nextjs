import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'

// GET - Get all entrants with their giveaway participation
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    // Get all unique entrants by email (since entries can have the same person)
    const entries = await prisma.giveaway_entries.findMany({
      where: {
        is_valid: true,
      },
      include: {
        giveaway: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    // Get all winners to mark which entries won
    const winners = await prisma.giveaway_winners.findMany({
      where: {
        winner_type: 'primary',
      },
      select: {
        entry_id: true,
        giveaway_id: true,
      },
    })

    const winnerEntryIds = new Set(winners.map(w => w.entry_id))

    // Group entries by email to create unique entrants
    const entrantMap = new Map<string, {
      id: number;
      email: string;
      phone: string | null;
      firstName: string;
      lastName: string;
      state: string | null;
      zipCode: string | null;
      smsOptIn: boolean;
      firstEntry: Date;
      totalEntries: number;
      giveaways: Map<number, {
        giveawayId: number;
        giveawayTitle: string;
        entryCount: number;
        enteredAt: Date;
        isWinner: boolean;
      }>;
    }>()

    for (const entry of entries) {
      const key = entry.email.toLowerCase()

      if (!entrantMap.has(key)) {
        entrantMap.set(key, {
          id: entry.id,
          email: entry.email,
          phone: entry.phone,
          firstName: entry.first_name,
          lastName: entry.last_name,
          state: entry.state,
          zipCode: entry.zip_code,
          smsOptIn: entry.sms_opt_in ?? false,
          firstEntry: entry.created_at ?? new Date(),
          totalEntries: 0,
          giveaways: new Map(),
        })
      }

      const entrant = entrantMap.get(key)!

      // Update first entry if this one is earlier
      if (entry.created_at && entry.created_at < entrant.firstEntry) {
        entrant.firstEntry = entry.created_at
      }

      // Update phone and smsOptIn if this entry has them
      if (entry.phone && !entrant.phone) {
        entrant.phone = entry.phone
      }
      if (entry.sms_opt_in) {
        entrant.smsOptIn = true
      }

      // Add entry count (each entry = 1)
      const entryCount = 1
      entrant.totalEntries += entryCount

      // Track giveaway participation
      if (!entrant.giveaways.has(entry.giveaway_id)) {
        entrant.giveaways.set(entry.giveaway_id, {
          giveawayId: entry.giveaway_id,
          giveawayTitle: entry.giveaway.title,
          entryCount: 0,
          enteredAt: entry.created_at ?? new Date(),
          isWinner: winnerEntryIds.has(entry.id),
        })
      }

      const giveawayEntry = entrant.giveaways.get(entry.giveaway_id)!
      giveawayEntry.entryCount += entryCount

      // Update isWinner if this entry won
      if (winnerEntryIds.has(entry.id)) {
        giveawayEntry.isWinner = true
      }
    }

    // Convert to array and sort by first entry date (most recent first)
    const entrants = Array.from(entrantMap.values())
      .map(entrant => ({
        ...entrant,
        firstEntry: entrant.firstEntry.toISOString(),
        giveawaysEntered: entrant.giveaways.size,
        giveaways: Array.from(entrant.giveaways.values())
          .map(g => ({
            ...g,
            enteredAt: g.enteredAt.toISOString(),
          }))
          .sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()),
      }))
      .sort((a, b) => new Date(b.firstEntry).getTime() - new Date(a.firstEntry).getTime())

    return successResponse(entrants)
  } catch (error) {
    console.error('Error fetching entrants:', error)
    return errorResponse('Failed to fetch entrants')
  }
}
