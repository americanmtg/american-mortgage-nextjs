'use client';

import Link from 'next/link';
import styles from './HeroSection.module.css';

interface HeroSettings {
  eyebrow?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  buttonText?: string;
  buttonUrl?: string;
  reassuranceTime?: string;
  reassuranceText?: string;
  ratingPercent?: string;
  ratingText?: string;
}

interface HeroSectionProps {
  settings?: HeroSettings;
}

export default function HeroSection({ settings }: HeroSectionProps) {
  // Use settings with defaults
  const eyebrow = settings?.eyebrow || 'Trusted Nationwide';
  const headlineLine1 = settings?.headlineLine1 || 'Get home with the';
  const headlineLine2 = settings?.headlineLine2 || 'first name in financing';
  const buttonText = settings?.buttonText || 'Get Started Now';
  const buttonUrl = settings?.buttonUrl || '/apply';
  const reassuranceTime = settings?.reassuranceTime || '3 min';
  const reassuranceText = settings?.reassuranceText || 'No impact to credit';
  const ratingPercent = settings?.ratingPercent || '98%';
  const ratingText = settings?.ratingText || 'would recommend';

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.trustBadge}>
          <div className={styles.avatarGroup}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.avatar}>
                <div className={styles.avatarInner} />
              </div>
            ))}
          </div>
          <div className={styles.ratingPill}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className={styles.star} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <div className={styles.ratingLine}>
              <span className={styles.ratingPercent}>{ratingPercent}</span>
              <span className={styles.ratingText}>{ratingText}</span>
            </div>
          </div>
        </div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.headline}>
          {headlineLine1}<br />
          <span className={styles.headlineItalic}>{headlineLine2}</span>
        </h1>
        <Link href={buttonUrl} className={styles.ctaButton}>{buttonText}</Link>
        <p className={styles.reassurance}>
          <span className={styles.timeSpan}>
            <svg className={styles.clockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ marginLeft: '6px' }}>{reassuranceTime}</span>
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.creditImpact}>{reassuranceText}</span>
        </p>
      </div>
    </section>
  );
}
