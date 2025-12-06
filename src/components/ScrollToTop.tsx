'use client';

import { useEffect } from 'react';

export default function ScrollToTop() {
  useEffect(() => {
    // Only scroll to top on desktop
    if (window.innerWidth >= 768) {
      window.scrollTo(0, 0);
    }
  }, []);

  return null;
}
