import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getGiveawayBySlug, getActiveGiveaways, getPastGiveaways } from '@/lib/data';
import { lookupZipCode } from '@/lib/zipcode';
import GiveawayEntryForm from './GiveawayEntryForm';
import CompactCountdown from './CompactCountdown';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Winner {
  firstName: string;
  zipCode?: string | null;
  city?: string | null;
  state?: string | null;
  entryCount: number;
  winnerType?: string | null;
  selectionMethod?: string | null;
}

interface PastGiveaway {
  id: number;
  title: string;
  slug: string;
  prizeTitle: string;
  prizeValue: number | null;
  prizeImage: string | null;
  startDate: string;
  endDate: string;
  totalEntries: number;
  totalWinners: number;
  winnerSelectedAt: string | null;
  selectionMethod: string;
  deliveryMethod: string;
  winners: Winner[];
  winner: Winner | null;
}

export default async function GiveawayPage({ params }: PageProps) {
  const { slug } = await params;
  const giveaway = await getGiveawayBySlug(slug);

  if (!giveaway) {
    notFound();
  }

  // Fetch other active giveaways (excluding current one)
  const allActiveGiveaways = await getActiveGiveaways();
  const otherGiveaways = allActiveGiveaways.filter(g => g.slug !== slug);

  // Fetch past giveaways with winners
  const pastGiveawaysRaw = await getPastGiveaways();

  // Look up cities from ZIP codes for all winners
  const pastGiveaways: PastGiveaway[] = await Promise.all(
    pastGiveawaysRaw.map(async (g) => {
      const winnersWithCities = await Promise.all(
        (g.winners || []).map(async (w) => {
          let city = null;
          let state = null;
          if (w.zipCode) {
            const zipInfo = await lookupZipCode(w.zipCode);
            if (zipInfo) {
              city = zipInfo.city;
              state = zipInfo.stateAbbr;
            }
          }
          return { ...w, city, state };
        })
      );

      return {
        ...g,
        winners: winnersWithCities,
        winner: winnersWithCities[0] || null,
      };
    })
  );

  function formatDateShort(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago',
    });
  }

  function formatDateWithTime(dateString: string) {
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

  function formatCurrency(value: number | null) {
    if (value === null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const isEnded = new Date() > new Date(giveaway.endDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile: Full-width image hero */}
      <div className="md:hidden">
        {/* Full-width prize image - uses detailImage if available, falls back to prizeImage */}
        <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-blue-100 to-blue-50">
          {(giveaway.detailImage || giveaway.prizeImage) ? (
            <Image
              src={giveaway.detailImage || giveaway.prizeImage || ''}
              alt={giveaway.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-20 h-20 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content below image */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          {/* Badges row - matching card styling */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {giveaway.prizeValue && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Value: {formatCurrency(giveaway.prizeValue)}
              </div>
            )}
            {!isEnded && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{giveaway.title}</h1>

          {/* Stats grid - matching card info */}
          <div className="space-y-1 mb-2 text-xs">
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-600">Entries: <span className="font-medium text-gray-900">{giveaway.totalEntries?.toLocaleString() || 0}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-gray-600">Winners: <span className="font-medium text-gray-900">{giveaway.numWinners}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-600">Selection: <span className="font-medium text-gray-900">Random</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900 capitalize">{giveaway.deliveryMethod}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">Ends: <span className="font-medium text-gray-900">{formatDateWithTime(giveaway.endDate)}</span></span>
            </div>
          </div>

          {/* Countdown */}
          {!isEnded && (
            <CompactCountdown endDate={giveaway.endDate} />
          )}

          {isEnded && (
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-center">
              <span className="text-sm font-medium text-gray-600">This giveaway has ended</span>
            </div>
          )}
        </div>

        {/* Entry Form */}
        <div className="px-4 py-4">
          {giveaway.isAcceptingEntries ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <GiveawayEntryForm
                giveawayId={giveaway.id}
                giveawaySlug={giveaway.slug}
                restrictedStates={giveaway.restrictedStates}
                entryType={giveaway.entryType as 'phone' | 'email' | 'both'}
                bonusEntriesEnabled={giveaway.bonusEntriesEnabled}
                bonusEntryCount={giveaway.bonusEntryCount}
              />
            </div>
          ) : isEnded ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Giveaway Ended</h2>
              <p className="text-sm text-gray-500 mb-4">This giveaway is no longer accepting entries.</p>
              <Link
                href="/giveaways"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                View Active Giveaways
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Coming Soon</h2>
              <p className="text-sm text-gray-500">
                Starts {formatDateShort(giveaway.startDate)}
              </p>
            </div>
          )}
        </div>

        {/* Prize Details - Collapsible */}
        {(giveaway.prizeDescription || giveaway.description) && (
          <details className="mx-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <summary className="px-4 py-3 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-50">
              Prize Details
            </summary>
            <div className="px-4 pt-3 pb-4 text-sm text-gray-600 border-t border-gray-100">
              {giveaway.description && <p className="mb-2">{giveaway.description}</p>}
              {giveaway.prizeDescription && <p>{giveaway.prizeDescription}</p>}
            </div>
          </details>
        )}

        {/* Dynamic Sections - Collapsible (FAQ, Official Rules, Fine Print, etc.) */}
        {giveaway.sections && giveaway.sections.length > 0 && giveaway.sections.map((section: any) => (
          <details
            key={section.id}
            className="mx-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            open={section.isExpanded}
          >
            <summary className="px-4 py-3 text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-50">
              {section.title}
            </summary>
            <div className="px-4 pt-3 pb-4 text-xs text-gray-500 whitespace-pre-wrap border-t border-gray-100">
              {section.content}
            </div>
          </details>
        ))}

        {/* State Restrictions */}
        {giveaway.restrictedStates && giveaway.restrictedStates.length > 0 && (
          <div className="mx-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Not available in: {giveaway.restrictedStates.join(', ')}
            </p>
          </div>
        )}

      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Back link */}
        <div className="container-custom pt-6">
          <Link
            href="/giveaways"
            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Giveaways
          </Link>
        </div>

        {/* Desktop Content - Side by Side Cards */}
        <div className="container-custom pb-8">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Giveaway Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Prize Image */}
              <div className="relative h-64 bg-gradient-to-br from-blue-100 to-blue-50">
                {(giveaway.detailImage || giveaway.prizeImage) ? (
                  <Image
                    src={giveaway.detailImage || giveaway.prizeImage || ''}
                    alt={giveaway.title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-20 h-20 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5">
                {/* Badges row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {giveaway.prizeValue && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Value: {formatCurrency(giveaway.prizeValue)}
                    </div>
                  )}
                  {!isEnded && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Active
                    </div>
                  )}
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-3">{giveaway.title}</h1>

                {/* Stats */}
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">Entries: <span className="font-medium text-gray-900">{giveaway.totalEntries?.toLocaleString() || 0}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-gray-600">Winners: <span className="font-medium text-gray-900">{giveaway.numWinners}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-gray-600">Selection: <span className="font-medium text-gray-900">Random</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900 capitalize">{giveaway.deliveryMethod}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">Ends: <span className="font-medium text-gray-900">{formatDateWithTime(giveaway.endDate)}</span></span>
                  </div>
                </div>

                {/* Countdown */}
                {!isEnded && (
                  <CompactCountdown endDate={giveaway.endDate} variant="desktop" />
                )}

                {isEnded && (
                  <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
                    <span className="text-sm font-medium text-gray-600">This giveaway has ended</span>
                  </div>
                )}

                {/* Prize Details */}
                {(giveaway.prizeDescription || giveaway.description) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Prize Details</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {giveaway.description && <p>{giveaway.description}</p>}
                      {giveaway.prizeDescription && <p>{giveaway.prizeDescription}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Entry Form + Note */}
            <div className="space-y-4">
              {giveaway.isAcceptingEntries ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <GiveawayEntryForm
                    giveawayId={giveaway.id}
                    giveawaySlug={giveaway.slug}
                    restrictedStates={giveaway.restrictedStates}
                    entryType={giveaway.entryType as 'phone' | 'email' | 'both'}
                    bonusEntriesEnabled={giveaway.bonusEntriesEnabled}
                    bonusEntryCount={giveaway.bonusEntryCount}
                    variant="desktop"
                  />
                </div>
              ) : isEnded ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Giveaway Ended</h2>
                  <p className="text-gray-500 mb-6">This giveaway is no longer accepting entries.</p>
                  <Link
                    href="/giveaways"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Active Giveaways
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                  <p className="text-gray-500">Starts {formatDateShort(giveaway.startDate)}</p>
                </div>
              )}

              {/* State Restrictions - Under Entry Form */}
              {giveaway.restrictedStates && giveaway.restrictedStates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Not available in: {giveaway.restrictedStates.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Sections - Full Width Below */}
          {giveaway.sections && giveaway.sections.length > 0 && (
            <div className="mt-6 space-y-4">
              {giveaway.sections.map((section: any) => (
                <details
                  key={section.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  open={section.isExpanded}
                >
                  <summary className="px-6 py-4 text-base font-semibold text-gray-900 cursor-pointer hover:bg-gray-50">
                    {section.title}
                  </summary>
                  <div className="px-6 pb-6 text-sm text-gray-500 whitespace-pre-wrap border-t border-gray-100 pt-4">
                    {section.content}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Other Active Giveaways - Shared Section */}
      {otherGiveaways.length > 0 && (
        <section className="py-6 md:py-10 bg-white border-t border-gray-200">
          <div className="container-custom">
            <div className="text-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">More Giveaways</h2>
              <p className="text-xs md:text-sm text-gray-600">Check out our other active giveaways</p>
            </div>

            {/* Mobile: Horizontal scroll compact cards */}
            <div className="flex overflow-x-auto gap-4 pb-2 md:hidden scrollbar-hide">
              {otherGiveaways.slice(0, 3).map((g) => (
                <Link
                  key={g.id}
                  href={`/giveaways/${g.slug}`}
                  className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-50">
                    {g.prizeImage ? (
                      <Image
                        src={g.prizeImage}
                        alt={g.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{g.title}</h3>
                    {g.prizeValue && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                        {formatCurrency(g.prizeValue)} Value
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Full card grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {otherGiveaways.slice(0, 3).map((g) => (
                <Link
                  key={g.id}
                  href={`/giveaways/${g.slug}`}
                  className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  {/* Prize Image */}
                  <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-50">
                    {g.prizeImage ? (
                      <Image
                        src={g.prizeImage}
                        alt={g.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {g.prizeValue && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Value: {formatCurrency(g.prizeValue)}
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Active
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                      {g.title}
                    </h3>

                    {/* Giveaway Details - Stacked */}
                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">Entries: <span className="font-medium text-gray-900">{g.totalEntries.toLocaleString()}</span></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="text-gray-600">Winners: <span className="font-medium text-gray-900">{g.numWinners}</span></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-gray-600">Selection: <span className="font-medium text-gray-900">{g.selectionMethod}</span></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900">{g.deliveryMethod}</span></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">Ends: <span className="font-medium text-gray-900">{formatDateShort(g.endDate)}</span></span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div
                      style={{ backgroundColor: g.buttonColor }}
                      className="w-full h-[50px] text-white text-sm rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all group-hover:opacity-90"
                    >
                      {g.buttonText}
                    </div>

                    {/* Giveaway ID */}
                    <div className="text-center mt-2">
                      <span className="text-[10px] text-gray-400">Giveaway ID: {g.id}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-4">
              <Link
                href="/giveaways"
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                View All Giveaways
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Previous Winners - Shared Section */}
      {pastGiveaways.length > 0 && (
        <section className="py-6 md:py-10 bg-gray-50 border-t border-gray-200">
          <div className="container-custom">
            <div className="text-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Previous Winners</h2>
              <p className="text-xs md:text-sm text-gray-600">Congratulations to our lucky winners!</p>
            </div>

            {/* Mobile: Horizontal scroll compact cards */}
            <div className="flex overflow-x-auto gap-4 pb-2 md:hidden scrollbar-hide">
              {pastGiveaways.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-50">
                    {g.prizeImage ? (
                      <Image
                        src={g.prizeImage}
                        alt={g.title}
                        fill
                        className="object-cover opacity-80"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{g.title}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {g.prizeValue && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                          {formatCurrency(g.prizeValue)} Value
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200">
                        Completed
                      </span>
                    </div>
                    {g.winner && (
                      <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-gray-900">{g.winner.firstName}</span>
                          {g.winner.city && g.winner.state && (
                            <span className="text-gray-500"> from {g.winner.city}, {g.winner.state}</span>
                          )}
                          {g.winner.entryCount > 0 && (
                            <span className="text-gray-500"> won with {g.winner.entryCount.toLocaleString()} {g.winner.entryCount === 1 ? 'entry' : 'entries'}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Full card grid matching /giveaways page */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {pastGiveaways.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full flex flex-col"
                >
                  {/* Prize Image - taller for desktop */}
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0">
                    {g.prizeImage ? (
                      <Image
                        src={g.prizeImage}
                        alt={g.prizeTitle}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-18a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Badges row - Value and Completed */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {g.prizeValue && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Value: {formatCurrency(g.prizeValue)}
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-300">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                      {g.title}
                    </h3>

                    {/* Giveaway Details - Stacked */}
                    <div className="space-y-1 mb-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">
                          Entries: <span className="font-medium text-gray-900">{g.totalEntries.toLocaleString()}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span className="text-gray-600">
                          Winners: <span className="font-medium text-gray-900">{g.totalWinners}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-gray-600">
                          Selection: <span className="font-medium text-gray-900">{g.selectionMethod}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">
                          Delivery: <span className="font-medium text-gray-900">{g.deliveryMethod}</span>
                        </span>
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="flex items-center gap-1.5 mb-3 text-xs">
                      <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600">
                        Ended: <span className="font-medium text-gray-900">{formatDateWithTime(g.endDate)}</span>
                      </span>
                    </div>

                    {/* Winner display - takes remaining space */}
                    <div className="mt-auto">
                      {g.winner ? (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-900">
                              <span className="font-semibold">{g.winner.firstName}</span>
                              {(g.winner.city || g.winner.state) && (
                                <span className="text-gray-600">
                                  {' '}from {g.winner.city}{g.winner.city && g.winner.state && ', '}{g.winner.state}
                                </span>
                              )}
                              <span className="text-gray-600"> won with {g.winner.entryCount} {g.winner.entryCount === 1 ? 'entry' : 'entries'}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Winner announced {formatDateShort(g.endDate)}
                        </p>
                      )}

                      {/* Giveaway ID */}
                      <div className="text-center mt-1">
                        <span className="text-[10px] text-gray-400">Giveaway ID: {g.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
