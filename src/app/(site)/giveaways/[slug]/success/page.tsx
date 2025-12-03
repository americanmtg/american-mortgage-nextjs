'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

export default function GiveawaySuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [giveaway, setGiveaway] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Get entry info from URL params
  const referralCode = searchParams.get('ref');
  const bonusEntries = parseInt(searchParams.get('bonus') || '1');
  const entryId = searchParams.get('entryId');
  const canClaimBonus = searchParams.get('canClaimBonus') === 'true';

  // Bonus entry form state
  const [bonusEmail, setBonusEmail] = useState('');
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [bonusError, setBonusError] = useState('');

  useEffect(() => {
    async function fetchGiveaway() {
      try {
        const res = await fetch(`/api/giveaways/public?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.giveaway) {
            setGiveaway(data.giveaway);
          }
        }
      } catch (err) {
        console.error('Failed to fetch giveaway:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGiveaway();
  }, [slug]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
    return `${dateStr} at ${timeStr}`;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dev.americanmtg.com';
  const referralUrl = referralCode ? `${baseUrl}/giveaways/${slug}?ref=${referralCode}` : null;

  async function copyToClipboard() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function handleClaimBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!entryId || !bonusEmail) return;

    setBonusSubmitting(true);
    setBonusError('');

    try {
      const res = await fetch('/api/giveaways/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: parseInt(entryId),
          giveawayId: giveaway?.id,
          secondaryContact: bonusEmail,
          secondaryContactType: 'email',
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to claim bonus entry');
      }

      setBonusClaimed(true);
    } catch (err: any) {
      setBonusError(err.message);
    } finally {
      setBonusSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <section className="py-8 md:py-12">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            {/* Compact Success Header */}
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">You're Entered!</h1>
              <p className="text-sm text-gray-600">Good luck in the drawing!</p>
            </div>

            {/* Compact Entry Confirmation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">{giveaway?.title || 'Giveaway'}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Confirmed
                </span>
              </div>
              {giveaway && (
                <p className="text-xs text-gray-500">
                  Drawing: {giveaway.drawingDate ? formatDate(giveaway.drawingDate) : formatDate(giveaway.endDate)}
                </p>
              )}
            </div>

            {/* Bonus Entry for Email - Only show if they can claim bonus */}
            {canClaimBonus && !bonusClaimed && giveaway?.bonusEntriesEnabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="mb-2">
                  <span className="text-xs font-bold text-blue-800">
                    +{giveaway.bonusEntryCount || 1} Bonus {(giveaway.bonusEntryCount || 1) === 1 ? 'Entry' : 'Entries'}
                  </span>
                  <span className="text-xs text-blue-700 ml-1">(optional)</span>
                </div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Email Address
                </label>
                <form onSubmit={handleClaimBonus} className="space-y-2">
                  <input
                    type="email"
                    value={bonusEmail}
                    onChange={(e) => setBonusEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                  />
                  {bonusError && (
                    <p className="text-xs text-red-600">{bonusError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={bonusSubmitting || !bonusEmail}
                    className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bonusSubmitting ? 'Claiming...' : `Claim ${giveaway.bonusEntryCount || 1} Bonus ${(giveaway.bonusEntryCount || 1) === 1 ? 'Entry' : 'Entries'}`}
                  </button>
                </form>
              </div>
            )}

            {/* Bonus claimed confirmation */}
            {bonusClaimed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
                <p className="text-sm font-medium text-green-800">
                  Bonus entry claimed!
                </p>
              </div>
            )}

            {/* Referral Share Section - Matching the check entries style */}
            {referralUrl && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-bold text-purple-900 mb-1">
                  Claim more chances to win:
                </h3>
                <div className="mb-2">
                  <span className="text-xs font-bold text-purple-800">
                    +{bonusEntries} Bonus {bonusEntries === 1 ? 'Entry' : 'Entries'} Per Referral
                  </span>
                </div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Your Referral Link
                </label>
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-sm text-gray-600 mb-2"
                />
                <button
                  onClick={copyToClipboard}
                  className={`w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {copied ? 'Copied to Clipboard!' : 'Copy Referral Link'}
                </button>
              </div>
            )}

            {/* What's Next - Compact */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">What's Next?</h3>
              <ul className="space-y-1.5 text-gray-600 text-xs">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Confirmation email sent shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Winners notified after the drawing</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/giveaways"
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold text-center"
              >
                More Giveaways
              </Link>
              <Link
                href="/"
                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-center"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
