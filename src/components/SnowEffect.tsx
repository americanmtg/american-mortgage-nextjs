'use client';

import styles from './SnowEffect.module.css';

// Pre-generate snowflakes with staggered positions throughout the fall
const snowflakes = Array.from({ length: 60 }, (_, i) => {
  const duration = 8 + (i % 6) * 1.5; // 8-15.5s fall time
  // Spread initial positions throughout the animation cycle
  const initialProgress = (i / 60) * duration; // Distribute start times evenly
  return {
    id: i,
    left: (i * 1.7 + Math.sin(i * 0.5) * 15) % 100,
    size: 2 + (i % 4),
    opacity: 0.35 + (i % 4) * 0.12,
    duration,
    delay: -initialProgress, // Negative delay starts animation mid-cycle
    drift: ((i % 7) - 3) * 8,
  };
});

export default function SnowEffect() {
  return (
    <div className={styles.snowContainer} aria-hidden="true">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={styles.snowflake}
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            ['--drift' as string]: `${flake.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
