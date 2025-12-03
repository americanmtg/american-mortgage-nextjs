'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

// Confetti burst animation function - bursts upward from button
function createConfetti(colors: string[], buttonElement?: HTMLElement) {
  const confettiCount = 100;
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  // Get button position for burst origin
  const buttonRect = buttonElement?.getBoundingClientRect();
  const originX = buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2;
  const originY = buttonRect ? buttonRect.top : window.innerHeight / 2;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    // Skinnier confetti - width 2-4px, height 8-16px
    const width = Math.random() * 2 + 2;
    const height = Math.random() * 8 + 8;
    const angle = (Math.random() - 0.5) * 180; // Spread angle (-90 to 90 degrees, mostly upward)
    const velocity = Math.random() * 300 + 200; // How far it travels
    const duration = Math.random() * 1.5 + 1.5;
    const delay = Math.random() * 0.2;
    const rotation = Math.random() * 360;

    // Calculate end position based on angle and velocity
    const radians = (angle - 90) * (Math.PI / 180); // -90 to make it go up
    const endX = Math.cos(radians) * velocity;
    const endY = Math.sin(radians) * velocity;

    confetti.style.cssText = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background-color: ${color};
      left: ${originX}px;
      top: ${originY}px;
      opacity: 1;
      border-radius: 1px;
      transform: rotate(${rotation}deg);
      animation: confetti-burst-${i} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards;
    `;

    // Create unique keyframes for each confetti piece
    const keyframes = document.createElement('style');
    keyframes.textContent = `
      @keyframes confetti-burst-${i} {
        0% {
          transform: translate(0, 0) rotate(${rotation}deg);
          opacity: 1;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translate(${endX}px, ${endY}px) rotate(${rotation + 720}deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(keyframes);
    container.appendChild(confetti);

    // Clean up keyframes after animation
    setTimeout(() => {
      keyframes.remove();
    }, (duration + delay) * 1000 + 100);
  }

  // Remove container after animation
  setTimeout(() => {
    container.remove();
  }, 4000);
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

interface Props {
  giveaways: PastGiveaway[];
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  return `${dateStr} at ${timeStr} CST`;
}

function formatDateLong(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Chicago',
  });
}

export default function PastWinnersCarousel({ giveaways }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 364; // 340px card + 24px gap
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // If only 1-3 items, show as grid without carousel
  if (giveaways.length <= 3) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[340px] mx-auto md:max-w-none">
        {giveaways.map((giveaway) => (
          <GiveawayCard key={giveaway.id} giveaway={giveaway} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {giveaways.map((giveaway) => (
          <div key={giveaway.id} className="flex-shrink-0 w-[calc(100vw-48px)] max-w-[340px]" style={{ scrollSnapAlign: 'start' }}>
            <GiveawayCard giveaway={giveaway} />
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {giveaways.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const container = scrollContainerRef.current;
              if (container) {
                container.scrollTo({ left: index * 364, behavior: 'smooth' });
              }
            }}
            className="w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Winners swipe component for multiple winners
function WinnersSwipe({ winners, winnerSelectedAt, endDate }: {
  winners: Winner[];
  winnerSelectedAt: string | null;
  endDate: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < winners.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    touchStartX.current = null;
  };

  if (winners.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Winner announced {formatDateLong(endDate)}
      </p>
    );
  }

  const winner = winners[currentIndex];

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-900">
            <span className="font-semibold">{winner.firstName}</span>
            {(winner.city || winner.state) && (
              <span className="text-gray-600">
                {' '}from {winner.city}{winner.city && winner.state && ', '}{winner.state}
              </span>
            )}
            <span className="text-gray-600"> won with {winner.entryCount} {winner.entryCount === 1 ? 'entry' : 'entries'}</span>
          </p>
        </div>
        {/* Navigation arrows for multiple winners */}
        {winners.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Previous winner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 min-w-[40px] text-center">
              {currentIndex + 1}/{winners.length}
            </span>
            <button
              onClick={() => setCurrentIndex(Math.min(winners.length - 1, currentIndex + 1))}
              disabled={currentIndex === winners.length - 1}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              aria-label="Next winner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {/* Swipe indicator dots for multiple winners */}
      {winners.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {winners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
              aria-label={`Go to winner ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
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

function GiveawayCard({ giveaway }: { giveaway: PastGiveaway }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col">
      {/* Prize Image */}
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex-shrink-0">
        {giveaway.prizeImage ? (
          <Image
            src={giveaway.prizeImage}
            alt={giveaway.prizeTitle}
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
          {/* Value badge */}
          {giveaway.prizeValue && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Value: {formatCurrency(giveaway.prizeValue)}
            </div>
          )}
          {/* Completed badge - grey to match individual giveaway page */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded border border-gray-300">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-1">
          {giveaway.title}
        </h3>

        {/* Giveaway Details - Stacked */}
        <div className="space-y-1 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-600">
              Entries: <span className="font-medium text-gray-900">{giveaway.totalEntries.toLocaleString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-gray-600">
              Winners: <span className="font-medium text-gray-900">{giveaway.totalWinners}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-gray-600">
              Selection: <span className="font-medium text-gray-900">{giveaway.selectionMethod}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">
              Delivery: <span className="font-medium text-gray-900">{giveaway.deliveryMethod}</span>
            </span>
          </div>
        </div>

        {/* End Date - full width */}
        <div className="flex items-center gap-1.5 mb-3 text-xs">
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600">
            Ended: <span className="font-medium text-gray-900">{formatDateTime(giveaway.endDate)}</span>
          </span>
        </div>

        {/* Winners section with swipe - takes remaining space */}
        <div className="mt-auto">
          <WinnersSwipe
            winners={giveaway.winners}
            winnerSelectedAt={giveaway.winnerSelectedAt}
            endDate={giveaway.endDate}
          />

          {/* Giveaway ID - below winner badge */}
          <div className="text-center mt-1">
            <span className="text-[10px] text-gray-400">Giveaway ID: {giveaway.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
