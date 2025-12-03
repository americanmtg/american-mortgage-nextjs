import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { lookupZipCode } from '@/lib/zipcode'

// GET - Get active giveaways (public, no auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // If slug provided, get specific giveaway
    if (slug) {
      const giveaway = await prisma.giveaways.findUnique({
        where: { slug },
      })

      if (!giveaway) {
        return NextResponse.json(
          { success: false, error: 'Giveaway not found' },
          { status: 404 }
        )
      }

      // Only return if active (or for previewing ended giveaways)
      if (giveaway.status === 'draft' || giveaway.status === 'cancelled') {
        return NextResponse.json(
          { success: false, error: 'Giveaway not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        giveaway: {
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
          status: giveaway.status,
          restrictedStates: giveaway.restricted_states,
          // Calculate if currently accepting entries
          isAcceptingEntries: giveaway.status === 'active' &&
            new Date() >= giveaway.start_date &&
            new Date() <= giveaway.end_date,
        },
      })
    }

    // Return list of active giveaways (exclude ones with winners already selected)
    const now = new Date()
    const giveaways = await prisma.giveaways.findMany({
      where: {
        status: 'active',
        start_date: { lte: now },
        end_date: { gte: now },
        winner_selected: false,
      },
      orderBy: { end_date: 'asc' },
    })

    // Also fetch past giveaways with winners
    const pastGiveaways = await prisma.giveaways.findMany({
      where: {
        winner_selected: true,
        archived: { not: true },
      },
      orderBy: { end_date: 'desc' },
      take: 10, // Limit to last 10 completed giveaways
      include: {
        winners: {
          include: {
            entry: {
              select: {
                id: true,
                first_name: true,
                zip_code: true,
              },
            },
          },
          orderBy: [
            { winner_type: 'asc' }, // primary first
            { alternate_order: 'asc' },
          ],
        },
        _count: {
          select: {
            entries: {
              where: { is_valid: true },
            },
            winners: true,
          },
        },
      },
    })

    // Look up cities from ZIP codes and entry counts for past winners
    const pastGiveawaysWithCities = await Promise.all(
      pastGiveaways.map(async (g) => {
        // Process all winners with their entry counts and cities
        const winnersWithDetails = await Promise.all(g.winners.map(async (w) => {
          let city = null;
          if (w.entry?.zip_code) {
            const zipInfo = await lookupZipCode(w.entry.zip_code);
            if (zipInfo) {
              city = zipInfo.city;
            }
          }

          const winnerEntry = await prisma.giveaway_entries.findUnique({
            where: { id: w.entry.id },
            select: { email: true },
          });

          let entryCount = 0;
          if (winnerEntry) {
            entryCount = await prisma.giveaway_entries.count({
              where: {
                giveaway_id: g.id,
                email: { equals: winnerEntry.email, mode: 'insensitive' },
                is_valid: true,
              },
            });
          }

          return {
            firstName: w.entry.first_name,
            city,
            entryCount,
            winnerType: w.winner_type,
            selectionMethod: w.selection_method || 'manual',
          };
        }));

        const primaryWinner = g.winners[0];

        return {
          id: g.id,
          title: g.title,
          slug: g.slug,
          prizeTitle: g.prize_title,
          prizeValue: g.prize_value ? Number(g.prize_value) : null,
          prizeImage: g.prize_image,
          startDate: g.start_date,
          endDate: g.end_date,
          totalEntries: g._count.entries,
          totalWinners: g._count.winners,
          winnerSelectedAt: primaryWinner?.created_at || null,
          selectionMethod: primaryWinner?.selection_method === 'automated' ? 'Automated' : 'Manual',
          winners: winnersWithDetails,
          // Keep backward compatibility
          winner: winnersWithDetails[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      giveaways: giveaways.map(g => ({
        id: g.id,
        title: g.title,
        slug: g.slug,
        description: g.description,
        prizeTitle: g.prize_title,
        prizeValue: g.prize_value ? Number(g.prize_value) : null,
        prizeImage: g.prize_image,
        startDate: g.start_date,
        endDate: g.end_date,
      })),
      pastGiveaways: pastGiveawaysWithCities,
    })
  } catch (error) {
    console.error('Error fetching public giveaways:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch giveaways' },
      { status: 500 }
    )
  }
}
