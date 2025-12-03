import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendWinnerNotification } from '@/lib/notifications/email'
import { sendWinnerNotificationSms } from '@/lib/notifications/sms'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Generate cryptographically secure random selection
function secureRandomSelect<T>(array: T[], count: number): T[] {
  if (count >= array.length) return [...array]

  const selected: T[] = []
  const remaining = [...array]

  for (let i = 0; i < count; i++) {
    // Use crypto.randomBytes for cryptographically secure randomness
    const randomBuffer = randomBytes(4)
    const randomValue = randomBuffer.readUInt32BE(0)
    const index = randomValue % remaining.length
    selected.push(remaining[index])
    remaining.splice(index, 1)
  }

  return selected
}

// Generate claim token
function generateClaimToken(): string {
  return randomBytes(32).toString('hex')
}

// GET - List winners for a giveaway
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const winners = await prisma.giveaway_winners.findMany({
      where: { giveaway_id: giveawayId },
      orderBy: [
        { winner_type: 'asc' },
        { alternate_order: 'asc' },
      ],
      include: {
        entry: {
          select: {
            email: true,
            phone: true,
            first_name: true,
            last_name: true,
            state: true,
          },
        },
        prize_claim: true,
      },
    })

    return successResponse({
      winners: winners.map(w => ({
        id: w.id,
        giveawayId: w.giveaway_id,
        entryId: w.entry_id,
        winnerType: w.winner_type,
        alternateOrder: w.alternate_order,
        status: w.status,
        notifiedAt: w.notified_at,
        notificationMethod: w.notification_method,
        claimDeadline: w.claim_deadline,
        claimedAt: w.claimed_at,
        createdAt: w.created_at,
        entry: {
          email: w.entry.email,
          phone: w.entry.phone,
          firstName: w.entry.first_name,
          lastName: w.entry.last_name,
          state: w.entry.state,
        },
        hasClaim: w.prize_claim.length > 0,
        claimStatus: w.prize_claim.length > 0 ? {
          verified: w.prize_claim[0].verified,
          fulfillmentStatus: w.prize_claim[0].fulfillment_status,
        } : null,
      })),
    })
  } catch (error) {
    console.error('Error fetching winners:', error)
    return errorResponse('Failed to fetch winners')
  }
}

// POST - Select winners for a giveaway
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can select winners', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const giveaway = await prisma.giveaways.findUnique({
      where: { id: giveawayId },
    })

    if (!giveaway) {
      return errorResponse('Giveaway not found', 404)
    }

    if (giveaway.winner_selected) {
      return errorResponse('Winners have already been selected for this giveaway', 400)
    }

    // Get all valid entries
    const validEntries = await prisma.giveaway_entries.findMany({
      where: {
        giveaway_id: giveawayId,
        is_valid: true,
      },
    })

    if (validEntries.length === 0) {
      return errorResponse('No valid entries to select from', 400)
    }

    const numWinners = giveaway.num_winners ?? 1
    const alternateWinners = giveaway.alternate_winners ?? 0
    const totalWinnersNeeded = numWinners + alternateWinners

    if (validEntries.length < numWinners) {
      return errorResponse(`Not enough entries. Need at least ${numWinners} entries, but only have ${validEntries.length}`, 400)
    }

    // Select winners using cryptographically secure randomness
    const selectedEntries = secureRandomSelect(validEntries, Math.min(totalWinnersNeeded, validEntries.length))

    // Calculate claim deadline (default 7 days from now)
    const claimDeadline = new Date()
    claimDeadline.setDate(claimDeadline.getDate() + 7)

    // Create winner records
    const winnerRecords = []
    for (let i = 0; i < selectedEntries.length; i++) {
      const entry = selectedEntries[i]
      const isPrimary = i < numWinners

      const winner = await prisma.giveaway_winners.create({
        data: {
          giveaway_id: giveawayId,
          entry_id: entry.id,
          winner_type: isPrimary ? 'primary' : 'alternate',
          alternate_order: isPrimary ? null : i - numWinners + 1,
          status: 'pending',
          claim_token: generateClaimToken(),
          claim_deadline: claimDeadline,
        },
        include: {
          entry: {
            select: {
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      })
      winnerRecords.push(winner)
    }

    // Mark giveaway as winner selected and set status to ended
    await prisma.giveaways.update({
      where: { id: giveawayId },
      data: {
        winner_selected: true,
        status: 'ended',
        updated_at: new Date(),
      },
    })

    // Send notifications to primary winners
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.americanmtg.com'
    const claimDeadlineFormatted = claimDeadline.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

    for (const winner of winnerRecords.filter(w => w.winner_type === 'primary')) {
      const claimUrl = `${baseUrl}/claim/${winner.claim_token}`

      // Get full entry data for SMS
      const fullEntry = await prisma.giveaway_entries.findUnique({
        where: { id: winner.entry_id },
      })

      // Send email notification
      sendWinnerNotification({
        email: winner.entry.email,
        firstName: winner.entry.first_name,
        giveawayTitle: giveaway.title,
        prizeTitle: giveaway.prize_title,
        claimUrl,
        claimDeadline: claimDeadlineFormatted,
        giveawayId,
        entryId: winner.entry_id,
        winnerId: winner.id,
      }).catch(err => console.error('[WINNER] Failed to send email:', err))

      // Send SMS if they opted in
      if (fullEntry?.sms_opt_in && fullEntry?.phone) {
        sendWinnerNotificationSms({
          phone: fullEntry.phone,
          firstName: winner.entry.first_name,
          prizeTitle: giveaway.prize_title,
          claimUrl,
          giveawayId,
          entryId: winner.entry_id,
          winnerId: winner.id,
        }).catch(err => console.error('[WINNER] Failed to send SMS:', err))
      }

      // Update winner status to notified
      await prisma.giveaway_winners.update({
        where: { id: winner.id },
        data: {
          status: 'notified',
          notified_at: new Date(),
          notification_method: fullEntry?.sms_opt_in ? 'both' : 'email',
        },
      })
    }

    return successResponse({
      message: 'Winners selected successfully',
      primaryWinners: winnerRecords
        .filter(w => w.winner_type === 'primary')
        .map(w => ({
          id: w.id,
          entryId: w.entry_id,
          name: `${w.entry.first_name} ${w.entry.last_name}`,
          email: w.entry.email,
        })),
      alternateWinners: winnerRecords
        .filter(w => w.winner_type === 'alternate')
        .map(w => ({
          id: w.id,
          entryId: w.entry_id,
          order: w.alternate_order,
          name: `${w.entry.first_name} ${w.entry.last_name}`,
          email: w.entry.email,
        })),
    })
  } catch (error) {
    console.error('Error selecting winners:', error)
    return errorResponse('Failed to select winners')
  }
}

// PUT - Update winner status (notify, forfeit, etc.)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  if (auth.session.role !== 'admin') {
    return errorResponse('Only administrators can update winner status', 403)
  }

  try {
    const { id } = await params
    const giveawayId = parseInt(id)

    if (isNaN(giveawayId)) {
      return errorResponse('Invalid giveaway ID', 400)
    }

    const body = await request.json()
    const { winnerId, action, reason, channel } = body

    if (!winnerId || !action) {
      return errorResponse('Winner ID and action are required', 400)
    }

    const winner = await prisma.giveaway_winners.findFirst({
      where: {
        id: winnerId,
        giveaway_id: giveawayId,
      },
      include: {
        entry: true,
        giveaway: true,
      },
    })

    if (!winner) {
      return errorResponse('Winner not found', 404)
    }

    const validActions = ['notify', 'forfeit', 'disqualify', 'promote']

    if (!validActions.includes(action)) {
      return errorResponse(`Invalid action. Must be one of: ${validActions.join(', ')}`, 400)
    }

    switch (action) {
      case 'notify':
        // Build claim URL
        const notifyBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dev.americanmtg.com'
        const notifyClaimUrl = `${notifyBaseUrl}/claim/${winner.claim_token}`
        const notifyDeadlineFormatted = winner.claim_deadline?.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }) || 'in 7 days'

        // Determine which channels to use (default to 'both')
        const notifyChannel = channel || 'both'
        let emailSent = false
        let smsSent: boolean | undefined = undefined

        // Send email notification (if channel is 'email' or 'both')
        if (notifyChannel === 'email' || notifyChannel === 'both') {
          try {
            await sendWinnerNotification({
              email: winner.entry.email,
              firstName: winner.entry.first_name,
              giveawayTitle: winner.giveaway.title,
              prizeTitle: winner.giveaway.prize_title,
              claimUrl: notifyClaimUrl,
              claimDeadline: notifyDeadlineFormatted,
              giveawayId,
              entryId: winner.entry_id,
              winnerId,
            })
            emailSent = true
          } catch (err) {
            console.error('[WINNER] Failed to send email:', err)
            emailSent = false
          }
        }

        // Send SMS if opted in and channel allows
        if ((notifyChannel === 'sms' || notifyChannel === 'both') && winner.entry.sms_opt_in && winner.entry.phone) {
          try {
            await sendWinnerNotificationSms({
              phone: winner.entry.phone,
              firstName: winner.entry.first_name,
              prizeTitle: winner.giveaway.prize_title,
              claimUrl: notifyClaimUrl,
              giveawayId,
              entryId: winner.entry_id,
              winnerId,
            })
            smsSent = true
          } catch (err) {
            console.error('[WINNER] Failed to send SMS:', err)
            smsSent = false
          }
        }

        await prisma.giveaway_winners.update({
          where: { id: winnerId },
          data: {
            status: 'notified',
            notified_at: new Date(),
            notification_method: notifyChannel,
            updated_at: new Date(),
          },
        })

        return successResponse({
          message: 'Notification sent',
          notification: {
            emailSent,
            smsSent,
            channel: notifyChannel,
          },
        })

      case 'forfeit':
      case 'disqualify':
        await prisma.giveaway_winners.update({
          where: { id: winnerId },
          data: {
            status: action === 'forfeit' ? 'forfeited' : 'disqualified',
            updated_at: new Date(),
          },
        })

        // If auto alternate selection, promote next alternate
        if (winner.giveaway.alternate_selection === 'auto' && winner.winner_type === 'primary') {
          const nextAlternate = await prisma.giveaway_winners.findFirst({
            where: {
              giveaway_id: giveawayId,
              winner_type: 'alternate',
              status: 'pending',
            },
            orderBy: { alternate_order: 'asc' },
          })

          if (nextAlternate) {
            await prisma.giveaway_winners.update({
              where: { id: nextAlternate.id },
              data: {
                winner_type: 'primary',
                alternate_order: null,
                updated_at: new Date(),
              },
            })
          }
        }
        break

      case 'promote':
        // Promote an alternate to primary
        if (winner.winner_type !== 'alternate') {
          return errorResponse('Only alternates can be promoted', 400)
        }

        await prisma.giveaway_winners.update({
          where: { id: winnerId },
          data: {
            winner_type: 'primary',
            alternate_order: null,
            updated_at: new Date(),
          },
        })
        break
    }

    return successResponse({
      message: `Winner ${action} action completed`,
      winnerId,
    })
  } catch (error) {
    console.error('Error updating winner:', error)
    return errorResponse('Failed to update winner')
  }
}
