'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
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
      <div className="grid grid-cols-4 gap-4">
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((label) => (
          <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-4xl font-bold text-white">--</div>
            <div className="text-sm text-blue-200">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  const isEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isEnded) {
    return null;
  }

  return (
    <div>
      <p className="text-blue-200 text-sm mb-3 uppercase tracking-wide">Time Remaining</p>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-white">{timeLeft.days}</div>
          <div className="text-sm text-blue-200">Days</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-sm text-blue-200">Hours</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-sm text-blue-200">Minutes</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-sm text-blue-200">Seconds</div>
        </div>
      </div>
    </div>
  );
}
