'use client';

import styles from './SnowEffect.module.css';

// Seeded pseudo-random for consistent snowflake positions
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Pre-generate snowflakes with random positions, staggered across full cycle
const snowflakes = Array.from({ length: 60 }, (_, i) => {
  const duration = 8 + seededRandom(i + 100) * 7; // 8-15s fall time
  // Spread delays across the full duration so snow is always falling
  const delay = seededRandom(i + 200) * duration;
  return {
    id: i,
    left: seededRandom(i) * 100, // Random horizontal position 0-100%
    size: 2 + seededRandom(i + 50) * 3, // 2-5px
    opacity: 0.3 + seededRandom(i + 75) * 0.4, // 0.3-0.7
    duration,
    delay,
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
          }}
        />
      ))}
    </div>
  );
}
