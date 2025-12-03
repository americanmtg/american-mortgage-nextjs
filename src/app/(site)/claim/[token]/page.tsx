import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import PrizeClaimForm from './PrizeClaimForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getWinnerByClaimToken(token: string) {
  const winner = await prisma.giveaway_winners.findUnique({
    where: { claim_token: token },
    include: {
      giveaway: true,
      entry: true,
      prize_claim: true,
    },
  });

  if (!winner) return null;

  // Check if claim deadline has passed
  const isExpired = winner.claim_deadline && new Date() > new Date(winner.claim_deadline);

  return {
    id: winner.id,
    giveawayId: winner.giveaway_id,
    entryId: winner.entry_id,
    winnerType: winner.winner_type,
    status: winner.status,
    claimDeadline: winner.claim_deadline?.toISOString() || null,
    claimedAt: winner.claimed_at?.toISOString() || null,
    isExpired,
    giveaway: {
      id: winner.giveaway.id,
      title: winner.giveaway.title,
      prizeTitle: winner.giveaway.prize_title,
      prizeDescription: winner.giveaway.prize_description,
      prizeValue: winner.giveaway.prize_value ? Number(winner.giveaway.prize_value) : null,
      prizeImage: winner.giveaway.prize_image,
      requireW9: winner.giveaway.require_w9,
      w9Threshold: Number(winner.giveaway.w9_threshold),
    },
    entry: {
      firstName: winner.entry.first_name,
      lastName: winner.entry.last_name,
      email: winner.entry.email,
      phone: winner.entry.phone,
      state: winner.entry.state,
    },
    prizeClaim: winner.prize_claim.length > 0 ? {
      id: winner.prize_claim[0].id,
      legalName: winner.prize_claim[0].legal_name,
      addressLine1: winner.prize_claim[0].address_line1,
      addressLine2: winner.prize_claim[0].address_line2,
      city: winner.prize_claim[0].city,
      state: winner.prize_claim[0].state,
      zipCode: winner.prize_claim[0].zip_code,
      w9Document: winner.prize_claim[0].w9_document,
      idDocument: winner.prize_claim[0].id_document,
      verified: winner.prize_claim[0].verified,
      fulfillmentStatus: winner.prize_claim[0].fulfillment_status,
    } : null,
  };
}

export default async function PrizeClaimPage({ params }: PageProps) {
  const { token } = await params;
  const winner = await getWinnerByClaimToken(token);

  if (!winner) {
    notFound();
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatCurrency(value: number | null) {
    if (value === null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Check various states
  const isAlreadyClaimed = winner.claimedAt !== null;
  const isExpired = winner.isExpired;
  const isPending = winner.status === 'pending';
  const isVerified = winner.prizeClaim?.verified === true;
  const isFulfilled = winner.prizeClaim?.fulfillmentStatus === 'fulfilled';

  // Determine if W-9 is required
  const requiresW9 = Boolean(winner.giveaway.requireW9) &&
    winner.giveaway.prizeValue !== null &&
    winner.giveaway.prizeValue >= winner.giveaway.w9Threshold;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            {!isExpired && !isAlreadyClaimed && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Congratulations, {winner.entry.firstName}!
                </h1>
                <p className="text-xl text-blue-100">
                  You&apos;ve won the <strong>{winner.giveaway.prizeTitle}</strong> from our{' '}
                  <strong>{winner.giveaway.title}</strong> giveaway!
                </p>
              </>
            )}

            {isAlreadyClaimed && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-green-400 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Prize Already Claimed
                </h1>
                <p className="text-xl text-blue-100">
                  You&apos;ve already submitted your claim for this prize.
                </p>
              </>
            )}

            {isExpired && !isAlreadyClaimed && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-red-400 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Claim Period Expired
                </h1>
                <p className="text-xl text-blue-100">
                  Unfortunately, the deadline to claim this prize has passed.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Already claimed - show status */}
            {isAlreadyClaimed && winner.prizeClaim && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Claim Status</h2>

                {/* Prize Info */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{winner.giveaway.prizeTitle}</p>
                      <p className="text-gray-600">{winner.giveaway.title}</p>
                      {winner.giveaway.prizeValue && (
                        <p className="text-sm text-blue-600 font-medium">{formatCurrency(winner.giveaway.prizeValue)} Value</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Steps */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Claim Submitted</p>
                      <p className="text-sm text-gray-500">Your claim information has been received</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {isVerified ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Verification</p>
                      <p className="text-sm text-gray-500">
                        {isVerified ? 'Your claim has been verified' : 'Our team is reviewing your claim'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isFulfilled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {isFulfilled ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 bg-gray-300 rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Prize Shipment</p>
                      <p className="text-sm text-gray-500">
                        {isFulfilled ? 'Your prize has been shipped!' : 'Your prize will be shipped after verification'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Summary */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Shipping Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="font-medium">{winner.prizeClaim.legalName}</p>
                    <p>{winner.prizeClaim.addressLine1}</p>
                    {winner.prizeClaim.addressLine2 && <p>{winner.prizeClaim.addressLine2}</p>}
                    <p>{winner.prizeClaim.city}, {winner.prizeClaim.state} {winner.prizeClaim.zipCode}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Questions?</strong> If you need to update your information or have questions about your prize,
                    please contact us at <a href="mailto:giveaways@americanmtg.com" className="underline">giveaways@americanmtg.com</a>
                  </p>
                </div>

                <div className="mt-8 text-center">
                  <Link
                    href="/giveaways"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View More Giveaways
                  </Link>
                </div>
              </div>
            )}

            {/* Expired - show message */}
            {isExpired && !isAlreadyClaimed && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <p className="text-gray-600 mb-6">
                  The claim deadline for this prize was{' '}
                  <strong>{winner.claimDeadline ? formatDate(winner.claimDeadline) : 'N/A'}</strong>.
                  The prize may be awarded to an alternate winner.
                </p>
                <p className="text-gray-600 mb-8">
                  If you believe this is an error, please contact us at{' '}
                  <a href="mailto:giveaways@americanmtg.com" className="text-blue-600 hover:underline">
                    giveaways@americanmtg.com
                  </a>
                </p>
                <Link
                  href="/giveaways"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Active Giveaways
                </Link>
              </div>
            )}

            {/* Not claimed yet - show form */}
            {!isAlreadyClaimed && !isExpired && (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Your Prize</h2>
                    <p className="text-gray-600 mb-6">
                      Please provide your shipping information to receive your prize.
                    </p>

                    {winner.claimDeadline && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                          <strong>Deadline:</strong> You must submit your claim by{' '}
                          {formatDate(winner.claimDeadline)}
                        </p>
                      </div>
                    )}

                    <PrizeClaimForm
                      token={token}
                      winnerId={winner.id}
                      entry={winner.entry}
                      requiresW9={requiresW9}
                    />
                  </div>
                </div>

                {/* Sidebar - Prize Details */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                    <h3 className="font-bold text-gray-900 mb-4">Your Prize</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Prize</p>
                        <p className="font-semibold text-gray-900">{winner.giveaway.prizeTitle}</p>
                      </div>

                      {winner.giveaway.prizeValue && (
                        <div>
                          <p className="text-sm text-gray-500">Value</p>
                          <p className="font-semibold text-gray-900">{formatCurrency(winner.giveaway.prizeValue)}</p>
                        </div>
                      )}

                      {winner.giveaway.prizeDescription && (
                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-gray-700 text-sm">{winner.giveaway.prizeDescription}</p>
                        </div>
                      )}
                    </div>

                    {requiresW9 && (
                      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>W-9 Required:</strong> Since this prize is valued at ${winner.giveaway.w9Threshold} or more,
                          a W-9 form is required for tax purposes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
