'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CountdownTimer from './CountdownTimer';

interface Giveaway {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  prizeTitle: string;
  prizeValue: number | null;
  prizeImage: string | null;
  startDate: string;
  endDate: string;
  totalEntries: number;
  numWinners: number;
  selectionMethod: string;
  deliveryMethod: string;
  buttonText: string;
  buttonColor: string;
  buttonIcon: string;
}

interface ActiveGiveawaysCarouselProps {
  giveaways: Giveaway[];
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

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ButtonIcon({ icon, className }: { icon: string; className?: string }) {
  switch (icon) {
    case 'ticket':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    case 'arrow':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      );
    case 'gift':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ActiveGiveawaysCarousel({ giveaways }: ActiveGiveawaysCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const cardWidth = containerRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const cardWidth = containerRef.current.offsetWidth;
      containerRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    }
  };

  // If only one giveaway, render without carousel
  if (giveaways.length === 1) {
    const giveaway = giveaways[0];
    const daysRemaining = getDaysRemaining(giveaway.endDate);
    const isEndingSoon = daysRemaining <= 3;

    return (
      <div className="max-w-[340px] mx-auto">
        <Link
          href={`/giveaways/${giveaway.slug}`}
          className="block bg-white rounded-xl shadow-md overflow-hidden"
        >
          {/* Prize Image */}
          <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-50">
            {giveaway.prizeImage ? (
              <Image
                src={giveaway.prizeImage}
                alt={giveaway.title}
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
              {giveaway.prizeValue && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Value: {formatCurrency(giveaway.prizeValue)}
                </div>
              )}
              {isEndingSoon && daysRemaining > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ends Soon!
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
              {giveaway.title}
            </h3>

            <div className="space-y-1 mb-3 text-xs">
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-600">Entries: <span className="font-medium text-gray-900">{giveaway.totalEntries.toLocaleString()}</span></span>
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
                <span className="text-gray-600">Selection: <span className="font-medium text-gray-900">{giveaway.selectionMethod}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900">{giveaway.deliveryMethod}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">Countdown: </span>
                <CountdownTimer endDate={giveaway.endDate} isEndingSoon={isEndingSoon} compact />
              </div>
            </div>

            <div
              style={{ backgroundColor: giveaway.buttonColor }}
              className="w-full h-[50px] text-white text-base rounded-lg font-semibold flex items-center justify-center gap-1.5"
            >
              <ButtonIcon icon={giveaway.buttonIcon} className="w-5 h-5" />
              {giveaway.buttonText}
            </div>

            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400">Giveaway ID: {giveaway.id}</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Multiple giveaways - render carousel
  return (
    <div className="relative">
      {/* Carousel Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {giveaways.map((giveaway, index) => {
          const daysRemaining = getDaysRemaining(giveaway.endDate);
          const isEndingSoon = daysRemaining <= 3;

          return (
            <div
              key={giveaway.id}
              className="flex-shrink-0 w-full snap-center px-2"
            >
              <div className="max-w-[340px] mx-auto">
                <Link
                  href={`/giveaways/${giveaway.slug}`}
                  className="block bg-white rounded-xl shadow-md overflow-hidden"
                >
                  {/* Prize Image */}
                  <div className="relative h-44 bg-gradient-to-br from-blue-100 to-blue-50">
                    {giveaway.prizeImage ? (
                      <Image
                        src={giveaway.prizeImage}
                        alt={giveaway.title}
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
                      {giveaway.prizeValue && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Value: {formatCurrency(giveaway.prizeValue)}
                        </div>
                      )}
                      {isEndingSoon && daysRemaining > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ends Soon!
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
                      {giveaway.title}
                    </h3>

                    <div className="space-y-1 mb-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-gray-600">Entries: <span className="font-medium text-gray-900">{giveaway.totalEntries.toLocaleString()}</span></span>
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
                        <span className="text-gray-600">Selection: <span className="font-medium text-gray-900">{giveaway.selectionMethod}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">Delivery: <span className="font-medium text-gray-900">{giveaway.deliveryMethod}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">Countdown: </span>
                        <CountdownTimer endDate={giveaway.endDate} isEndingSoon={isEndingSoon} compact />
                      </div>
                    </div>

                    <div
                      style={{ backgroundColor: giveaway.buttonColor }}
                      className="w-full h-[50px] text-white text-base rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    >
                      <ButtonIcon icon={giveaway.buttonIcon} className="w-5 h-5" />
                      {giveaway.buttonText}
                    </div>

                    <div className="text-center mt-2">
                      <span className="text-[10px] text-gray-400">Giveaway ID: {giveaway.id}</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {giveaways.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`Go to giveaway ${index + 1}`}
          />
        ))}
      </div>

      {/* Swipe hint text */}
      {giveaways.length > 1 && (
        <p className="text-center text-xs text-gray-400 mt-2">
          Swipe to see more giveaways
        </p>
      )}
    </div>
  );
}
