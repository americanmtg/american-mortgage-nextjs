'use client';

import { useState, useEffect } from 'react';

interface CompactCountdownProps {
  endDate: string;
  variant?: 'mobile' | 'desktop';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CompactCountdown({ endDate, variant = 'mobile' }: CompactCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function calculateTimeLeft(): TimeLeft {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
        <span className="text-xs text-yellow-700 font-medium">Time left:</span>
        <span className="text-sm font-bold text-yellow-800">--:--:--:--</span>
      </div>
    );
  }

  const isEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isEnded) {
    return null;
  }

  // Determine if ending soon (3 days or less)
  const isEndingSoon = timeLeft.days <= 3;

  if (variant === 'desktop') {
    // Desktop variant - matching mobile colors for readability
    return (
      <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
        isEndingSoon ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <span className={`text-sm font-medium ${isEndingSoon ? 'text-red-600' : 'text-yellow-700'}`}>
          {isEndingSoon ? 'Ends soon!' : 'Time left'}
        </span>
        <div className="flex items-center gap-1 text-sm font-mono">
          <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
            {timeLeft.days}d
          </span>
          <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
          <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
            {timeLeft.hours.toString().padStart(2, '0')}h
          </span>
          <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
          <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
            {timeLeft.minutes.toString().padStart(2, '0')}m
          </span>
          <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
          <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
            {timeLeft.seconds.toString().padStart(2, '0')}s
          </span>
        </div>
      </div>
    );
  }

  // Mobile variant
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${
      isEndingSoon ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <span className={`text-xs font-medium ${isEndingSoon ? 'text-red-600' : 'text-yellow-700'}`}>
        {isEndingSoon ? 'Ends soon!' : 'Time left'}
      </span>
      <div className="flex items-center gap-1 text-sm font-mono">
        <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
          {timeLeft.days}d
        </span>
        <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
        <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
          {timeLeft.hours.toString().padStart(2, '0')}h
        </span>
        <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
        <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
          {timeLeft.minutes.toString().padStart(2, '0')}m
        </span>
        <span className={isEndingSoon ? 'text-red-400' : 'text-yellow-500'}>:</span>
        <span className={`font-bold ${isEndingSoon ? 'text-red-700' : 'text-yellow-800'}`}>
          {timeLeft.seconds.toString().padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}

function TimeUnit({ value, label, isEndingSoon }: { value: number; label: string; isEndingSoon: boolean }) {
  return (
    <span className={`font-bold ${isEndingSoon ? 'text-red-200' : 'text-white'}`}>
      {value.toString().padStart(2, '0')}{label}
    </span>
  );
}
