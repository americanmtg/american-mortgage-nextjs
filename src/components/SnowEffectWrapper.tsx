'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SnowEffect to avoid SSR issues
const SnowEffect = dynamic(() => import('./SnowEffect'), { ssr: false });

export default function SnowEffectWrapper() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function checkSnowEffect() {
      try {
        const res = await fetch('/api/settings/site');
        if (res.ok) {
          const result = await res.json();
          setEnabled(result.data?.snowEffectEnabled ?? false);
        }
      } catch (error) {
        console.error('Failed to check snow effect setting:', error);
      } finally {
        setLoaded(true);
      }
    }

    checkSnowEffect();
  }, []);

  if (!loaded || !enabled) {
    return null;
  }

  return <SnowEffect />;
}
