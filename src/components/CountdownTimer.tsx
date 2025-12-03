'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
  isEndingSoon?: boolean;
  compact?: boolean;
}

export default function CountdownTimer({ endDate, isEndingSoon = false, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function calculateTimeLeft() {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted) {
    // Show loading state to prevent hydration mismatch
    if (compact) {
      return <span className="text-xs text-gray-500">--d --h --m --s</span>;
    }
    return (
      <div className="py-3 border-t border-b border-gray-100">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">--</p>
            <p className="text-xs text-gray-500">Days</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">--</p>
            <p className="text-xs text-gray-500">Hours</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">--</p>
            <p className="text-xs text-gray-500">Mins</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">--</p>
            <p className="text-xs text-gray-500">Secs</p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    if (compact) {
      return <span className="text-xs font-medium text-red-600">Ended</span>;
    }
    return (
      <div className="py-3 border-t border-b border-gray-100 text-center">
        <p className="text-lg font-bold text-red-600">Giveaway Ended</p>
      </div>
    );
  }

  const textColorClass = isEndingSoon ? 'text-red-600' : 'text-gray-900';

  // Compact inline mode
  if (compact) {
    return (
      <span className={`text-xs font-medium ${textColorClass}`}>
        {timeLeft.days}d {timeLeft.hours.toString().padStart(2, '0')}h {timeLeft.minutes.toString().padStart(2, '0')}m {timeLeft.seconds.toString().padStart(2, '0')}s
      </span>
    );
  }

  return (
    <div className="py-3 border-t border-b border-gray-100">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className={`text-lg font-bold ${textColorClass}`}>{timeLeft.days}</p>
          <p className="text-xs text-gray-500">Days</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${textColorClass}`}>{timeLeft.hours.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-500">Hours</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${textColorClass}`}>{timeLeft.minutes.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-500">Mins</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${textColorClass}`}>{timeLeft.seconds.toString().padStart(2, '0')}</p>
          <p className="text-xs text-gray-500">Secs</p>
        </div>
      </div>
    </div>
  );
}
